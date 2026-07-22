import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getSeasonForPrediction,
  getExistingPrediction,
} from "@/server/predictions/queries";
import { submitPrediction } from "@/server/predictions/mutations";
import { predictionFieldName } from "@/server/predictions/field-names";
import { getEffectiveStatus, seasonStatusLabels } from "@/server/seasons/lifecycle";
import { checkAndNotifyPredictionsLocked } from "@/server/seasons/mutations";
import { getClubs, getManagers } from "@/server/football/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiTeamSelect } from "@/components/predictions/multi-team-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";

type SeasonForPrediction = NonNullable<
  Awaited<ReturnType<typeof getSeasonForPrediction>>
>;
type SeasonQuestionForPrediction = SeasonForPrediction["seasonQuestions"][number];
type ExistingAnswer = NonNullable<
  Awaited<ReturnType<typeof getExistingPrediction>>
>["answers"][number];

function AnswerInput({
  seasonQuestion,
  existingAnswer,
  clubs,
  managers,
}: {
  seasonQuestion: SeasonQuestionForPrediction;
  existingAnswer: ExistingAnswer | undefined;
  clubs: { id: string; name: string }[];
  managers: { id: string; name: string }[];
}) {
  const key = predictionFieldName(seasonQuestion.id);
  const { answerType, selectionCount } = seasonQuestion.questionDefinition;
  const required = seasonQuestion.required;

  switch (answerType) {
    case "TEAM":
      return (
        <Select
          name={key}
          required={required}
          defaultValue={existingAnswer?.clubId ?? undefined}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Pick a team" />
          </SelectTrigger>
          <SelectContent>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={club.id}>
                {club.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "MANAGER":
      return (
        <Select
          name={key}
          required={required}
          defaultValue={existingAnswer?.managerId ?? undefined}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Pick a manager" />
          </SelectTrigger>
          <SelectContent>
            {managers.map((manager) => (
              <SelectItem key={manager.id} value={manager.id}>
                {manager.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "LEAGUE_POSITION":
      return (
        <Input
          name={key}
          type="number"
          min={1}
          max={20}
          required={required}
          defaultValue={existingAnswer?.numberValue ?? ""}
          className="w-24"
        />
      );
    case "NUMBER":
      return (
        <Input
          name={key}
          type="number"
          required={required}
          defaultValue={existingAnswer?.numberValue ?? ""}
          className="w-32"
        />
      );
    case "PLAYER":
      return (
        <Input
          name={key}
          type="text"
          placeholder="Player name"
          required={required}
          defaultValue={existingAnswer?.textValue ?? ""}
        />
      );
    case "TEXT":
      return (
        <Textarea
          name={key}
          required={required}
          defaultValue={existingAnswer?.textValue ?? ""}
          rows={2}
        />
      );
    case "MULTIPLE_TEAMS":
      return (
        <MultiTeamSelect
          name={key}
          clubs={clubs}
          selectionCount={selectionCount ?? 0}
          defaultSelectedIds={
            existingAnswer?.multiClubs.map((mc) => mc.clubId) ?? []
          }
        />
      );
    default:
      return null;
  }
}

export default async function PredictPage({
  params,
  searchParams,
}: {
  params: Promise<{ seasonId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { seasonId } = await params;
  const { saved } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/");

  const season = await getSeasonForPrediction(seasonId);
  if (!season) notFound();

  const effectiveStatus = getEffectiveStatus(season);

  if (effectiveStatus === "LOCKED") {
    checkAndNotifyPredictionsLocked(seasonId).catch((err) =>
      console.error("Lock notification check failed", err),
    );
  }

  if (effectiveStatus !== "OPEN") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">
          {season.competition.name} {season.label}
        </h1>
        <p className="text-muted-foreground">
          Predictions aren&apos;t open right now — this season is currently{" "}
          <Badge variant="outline">{seasonStatusLabels[effectiveStatus]}</Badge>.
        </p>
        {effectiveStatus !== "DRAFT" && (
          <Link
            href={`/seasons/${seasonId}/predictions`}
            className="text-sm text-primary hover:underline"
          >
            View everyone&apos;s predictions
          </Link>
        )}
      </div>
    );
  }

  const [existingPrediction, clubs, managers] = await Promise.all([
    getExistingPrediction(seasonId, session.user.id),
    getClubs(),
    getManagers(),
  ]);

  const answersBySeasonQuestionId = new Map(
    (existingPrediction?.answers ?? []).map((answer) => [
      answer.seasonQuestionId,
      answer,
    ]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {season.competition.name} {season.label}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {existingPrediction
            ? "Edit your predictions"
            : "Submit your predictions"}{" "}
          — you can keep changing your answers until predictions lock.
        </p>
      </div>

      {saved === "1" && (
        <Alert className="flex items-center gap-2 border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900">
          <CheckCircle2Icon className="size-4 shrink-0 text-green-700 dark:text-green-400" />
          <AlertDescription className="text-green-900 dark:text-green-200">
            Your predictions have been saved.
          </AlertDescription>
        </Alert>
      )}

      <form
        action={submitPrediction.bind(null, seasonId)}
        className="flex flex-col gap-6"
      >
        {season.seasonQuestions.map((seasonQuestion) => (
          <Card key={seasonQuestion.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                <span>
                  {seasonQuestion.order}.{" "}
                  {seasonQuestion.questionDefinition.text}
                </span>
                {!seasonQuestion.required && (
                  <Badge variant="outline">Optional</Badge>
                )}
                <Badge variant="secondary">{seasonQuestion.points} pts</Badge>
              </CardTitle>
              {seasonQuestion.questionDefinition.description && (
                <p className="text-sm text-muted-foreground">
                  {seasonQuestion.questionDefinition.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <AnswerInput
                seasonQuestion={seasonQuestion}
                existingAnswer={answersBySeasonQuestionId.get(seasonQuestion.id)}
                clubs={clubs}
                managers={managers}
              />
            </CardContent>
          </Card>
        ))}

        <Button type="submit" className="w-fit">
          Save predictions
        </Button>
      </form>
    </div>
  );
}
