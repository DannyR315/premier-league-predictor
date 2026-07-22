import { notFound } from "next/navigation";
import { getSeasonForResults } from "@/server/scoring/queries";
import {
  submitGroundTruthResult,
  gradeManualReviewAnswer,
  finalizeManualReviewQuestion,
} from "@/server/scoring/mutations";
import { getClubs, getManagers } from "@/server/football/queries";
import {
  answerTypeTagLabels,
  scoringStrategyTagLabels,
} from "@/server/questions/validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default async function SeasonResultsPage({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const [season, clubs, managers] = await Promise.all([
    getSeasonForResults(seasonId),
    getClubs(),
    getManagers(),
  ]);
  if (!season) notFound();

  if (season.status !== "ENDED" && season.status !== "COMPLETED") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">
          {season.competition.name} {season.label}
        </h1>
        <p className="text-muted-foreground">
          Results can be entered once you end the season.
        </p>
      </div>
    );
  }

  // Ended or Completed — editable even after completion so a mistake can
  // still be corrected (re-submitting just recomputes scores, see
  // requireResultsEditable in scoring/mutations.ts).
  const isEditable = season.status === "ENDED" || season.status === "COMPLETED";
  const finalizedCount = season.seasonQuestions.filter(
    (sq) => sq.resultFinalizedAt,
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {season.competition.name} {season.label}
          </h1>
          <Badge variant={season.status === "COMPLETED" ? "secondary" : "default"}>
            {season.status === "COMPLETED" ? "Completed" : "Ended"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {finalizedCount} of {season.seasonQuestions.length} questions
          finalized
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {season.seasonQuestions.map((seasonQuestion) => {
          const { questionDefinition: qd, result } = seasonQuestion;
          const finalized = Boolean(seasonQuestion.resultFinalizedAt);

          return (
            <Card key={seasonQuestion.id}>
              <CardHeader className="flex-row flex-wrap items-center gap-2">
                <CardTitle className="text-base">{qd.text}</CardTitle>
                <Badge variant="secondary">
                  {answerTypeTagLabels[qd.answerType]}
                </Badge>
                <Badge variant="outline">
                  {scoringStrategyTagLabels[qd.scoringStrategy]}
                </Badge>
                <Badge variant="outline">{seasonQuestion.points} pts</Badge>
                {finalized && <Badge>Finalized</Badge>}
              </CardHeader>
              <CardContent>
                {qd.scoringStrategy === "COMMUNITY_VOTE" && (
                  <p className="text-sm text-muted-foreground">
                    Community voting isn&apos;t available yet — this question
                    can&apos;t be finalized until it is.
                  </p>
                )}

                {qd.scoringStrategy === "MANUAL_REVIEW" && (
                  <ManualReviewSection
                    seasonQuestion={seasonQuestion}
                    editable={isEditable}
                  />
                )}

                {(qd.scoringStrategy === "EXACT_MATCH" ||
                  qd.scoringStrategy === "POSITION_DIFFERENCE" ||
                  qd.scoringStrategy === "MULTI_SELECT") && (
                  <GroundTruthSection
                    seasonQuestion={seasonQuestion}
                    result={result}
                    clubs={clubs}
                    managers={managers}
                    editable={isEditable}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

type SeasonQuestionWithData = NonNullable<
  Awaited<ReturnType<typeof getSeasonForResults>>
>["seasonQuestions"][number];

function formatGroundTruth(
  result: SeasonQuestionWithData["result"],
  answerType: string,
) {
  if (!result) return "Not set";
  switch (answerType) {
    case "TEAM":
      return result.club?.name ?? "Not set";
    case "MANAGER":
      return result.manager?.name ?? "Not set";
    case "MULTIPLE_TEAMS":
      return result.multiClubs.length > 0
        ? result.multiClubs.map((mc) => mc.club.name).join(", ")
        : "Not set";
    case "NUMBER":
    case "LEAGUE_POSITION":
      return result.numberValue ?? "Not set";
    default:
      return result.textValue ?? "Not set";
  }
}

function GroundTruthSection({
  seasonQuestion,
  result,
  clubs,
  managers,
  editable,
}: {
  seasonQuestion: SeasonQuestionWithData;
  result: SeasonQuestionWithData["result"];
  clubs: { id: string; name: string }[];
  managers: { id: string; name: string }[];
  editable: boolean;
}) {
  const { questionDefinition: qd } = seasonQuestion;

  if (!editable) {
    return (
      <p className="text-sm">
        Actual answer:{" "}
        <span className="font-medium">
          {formatGroundTruth(result, qd.answerType)}
        </span>
      </p>
    );
  }

  return (
    <form
      action={submitGroundTruthResult.bind(null, seasonQuestion.id)}
      className="flex flex-wrap items-end gap-4"
    >
      {qd.answerType === "TEAM" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`clubId-${seasonQuestion.id}`}>Actual team</Label>
          <Select name="clubId" defaultValue={result?.clubId ?? undefined}>
            <SelectTrigger id={`clubId-${seasonQuestion.id}`} className="w-56">
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
        </div>
      )}

      {qd.answerType === "MANAGER" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`managerId-${seasonQuestion.id}`}>
            Actual manager
          </Label>
          <Select
            name="managerId"
            defaultValue={result?.managerId ?? undefined}
          >
            <SelectTrigger
              id={`managerId-${seasonQuestion.id}`}
              className="w-56"
            >
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
        </div>
      )}

      {(qd.answerType === "NUMBER" || qd.answerType === "LEAGUE_POSITION") && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`numberValue-${seasonQuestion.id}`}>
            Actual number
          </Label>
          <Input
            id={`numberValue-${seasonQuestion.id}`}
            name="numberValue"
            type="number"
            defaultValue={result?.numberValue ?? ""}
            className="w-28"
          />
        </div>
      )}

      {qd.answerType === "MULTIPLE_TEAMS" && (
        <MultiTeamSelect
          name="clubIds"
          clubs={clubs}
          selectionCount={qd.selectionCount ?? 0}
          defaultSelectedIds={result?.multiClubs.map((mc) => mc.clubId) ?? []}
        />
      )}

      {(qd.answerType === "PLAYER" || qd.answerType === "TEXT") && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`textValue-${seasonQuestion.id}`}>
            Actual answer
          </Label>
          <Input
            id={`textValue-${seasonQuestion.id}`}
            name="textValue"
            defaultValue={result?.textValue ?? ""}
          />
        </div>
      )}

      <Button type="submit" className="w-fit">
        Save result
      </Button>
    </form>
  );
}

function ManualReviewSection({
  seasonQuestion,
  editable,
}: {
  seasonQuestion: SeasonQuestionWithData;
  editable: boolean;
}) {
  const allGraded = seasonQuestion.answers.every((a) => a.scoringResult);

  return (
    <div className="flex flex-col gap-3">
      {seasonQuestion.answers.length === 0 && (
        <p className="text-sm text-muted-foreground">No answers submitted.</p>
      )}
      {seasonQuestion.answers.map((answer) => {
        const graded = Boolean(answer.scoringResult);
        const isCorrect = graded && answer.scoringResult!.points > 0;
        return (
          <div
            key={answer.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2"
          >
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {answer.prediction.user.username}
              </span>
              <span className="font-medium">{answer.textValue ?? "—"}</span>
            </div>
            {editable ? (
              <div className="flex gap-2">
                <form
                  action={gradeManualReviewAnswer.bind(null, answer.id, true)}
                >
                  <Button
                    type="submit"
                    size="sm"
                    variant={graded && isCorrect ? "default" : "outline"}
                  >
                    Correct
                  </Button>
                </form>
                <form
                  action={gradeManualReviewAnswer.bind(null, answer.id, false)}
                >
                  <Button
                    type="submit"
                    size="sm"
                    variant={
                      graded && !isCorrect ? "destructive" : "outline"
                    }
                  >
                    Incorrect
                  </Button>
                </form>
              </div>
            ) : (
              <Badge variant={isCorrect ? "default" : "outline"}>
                {graded ? `${answer.scoringResult!.points} pts` : "Ungraded"}
              </Badge>
            )}
          </div>
        );
      })}

      {editable && (
        <form
          action={finalizeManualReviewQuestion.bind(null, seasonQuestion.id)}
          className="w-fit"
        >
          <Button type="submit" disabled={!allGraded} variant="outline">
            {allGraded
              ? "Finalize"
              : `Grade all answers first (${
                  seasonQuestion.answers.filter((a) => !a.scoringResult).length
                } left)`}
          </Button>
        </form>
      )}
    </div>
  );
}
