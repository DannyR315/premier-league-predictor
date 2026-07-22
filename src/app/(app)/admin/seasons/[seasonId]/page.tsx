import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSeason,
  getAvailableQuestionDefinitions,
} from "@/server/seasons/queries";
import {
  updateSeasonSchedule,
  openSeason,
  lockPredictionsNow,
  endSeason,
  deleteSeason,
  addSeasonQuestion,
  updateSeasonQuestion,
  removeSeasonQuestion,
  checkAndNotifyPredictionsLocked,
} from "@/server/seasons/mutations";
import {
  getEffectiveStatus,
  seasonStatusLabels,
  seasonStatusBadgeVariant,
} from "@/server/seasons/lifecycle";
import {
  answerTypeTagLabels,
  scoringStrategyTagLabels,
} from "@/server/questions/validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toDatetimeLocalValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const season = await getSeason(seasonId);
  if (!season) notFound();

  const effectiveStatus = getEffectiveStatus(season);
  if (effectiveStatus === "LOCKED") {
    checkAndNotifyPredictionsLocked(seasonId).catch((err) =>
      console.error("Lock notification check failed", err),
    );
  }
  const isDraft = season.status === "DRAFT";
  // Effective status: once locked, editing the schedule could push the
  // deadline forward and reopen predictions that have already been revealed.
  const scheduleEditable =
    effectiveStatus === "DRAFT" || effectiveStatus === "OPEN";
  const availableQuestions = isDraft
    ? await getAvailableQuestionDefinitions(seasonId)
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {season.competition.name} {season.label}
          </h1>
          <Badge variant={seasonStatusBadgeVariant[effectiveStatus]}>
            {seasonStatusLabels[effectiveStatus]}
          </Badge>
        </div>
        <div className="flex gap-2">
          {season.status !== "DRAFT" && (
            <Button asChild variant="outline">
              <Link href={`/seasons/${season.id}/predict`}>
                View prediction form
              </Link>
            </Button>
          )}
          {season.status === "DRAFT" && (
            <form action={openSeason.bind(null, season.id)}>
              <ConfirmSubmitButton
                type="submit"
                confirmMessage="Open this season for predictions? The question set can't be changed once it's open."
              >
                Open season
              </ConfirmSubmitButton>
            </form>
          )}
          {effectiveStatus === "OPEN" && (
            <form action={lockPredictionsNow.bind(null, season.id)}>
              <ConfirmSubmitButton
                type="submit"
                variant="outline"
                confirmMessage="Lock predictions now? This reveals everyone's predictions immediately and blocks further edits — normally this happens automatically at the deadline. Mainly useful for testing."
              >
                Lock predictions now
              </ConfirmSubmitButton>
            </form>
          )}
          {effectiveStatus === "LOCKED" && (
            <form action={endSeason.bind(null, season.id)}>
              <ConfirmSubmitButton
                type="submit"
                variant="destructive"
                confirmMessage="End this season? This marks it as finished for everyone browsing past seasons."
              >
                End season
              </ConfirmSubmitButton>
            </form>
          )}
          {season._count.predictions === 0 && (
            <form action={deleteSeason.bind(null, season.id)}>
              <ConfirmSubmitButton
                type="submit"
                variant="destructive"
                confirmMessage={`Delete the "${season.label}" season? This can't be undone.`}
              >
                {isDraft ? "Delete draft" : "Delete season"}
              </ConfirmSubmitButton>
            </form>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleEditable ? (
            <form
              action={updateSeasonSchedule.bind(null, season.id)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  name="label"
                  defaultValue={season.label}
                  required
                  className="max-w-40"
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="startDate">Season start date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={toDateInputValue(season.startDate)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="endDate">Season end date (optional)</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={
                      season.endDate ? toDateInputValue(season.endDate) : ""
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="predictionsLockAt">
                    Predictions lock at
                  </Label>
                  <Input
                    id="predictionsLockAt"
                    name="predictionsLockAt"
                    type="datetime-local"
                    defaultValue={toDatetimeLocalValue(
                      season.predictionsLockAt,
                    )}
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="outline" className="w-fit">
                Save schedule
              </Button>
            </form>
          ) : (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Start date</dt>
                <dd>{season.startDate.toDateString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">End date</dt>
                <dd>{season.endDate ? season.endDate.toDateString() : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Predictions locked</dt>
                <dd>{season.predictionsLockAt.toLocaleString()}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {season.seasonQuestions.length} question
          {season.seasonQuestions.length === 1 ? "" : "s"}
        </h2>

        {isDraft && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-base">Add question</CardTitle>
            </CardHeader>
            <CardContent>
              {availableQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Every question in the bank has already been added, or the
                  bank is empty.
                </p>
              ) : (
                <form
                  action={addSeasonQuestion.bind(null, season.id)}
                  className="flex flex-wrap items-end gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="questionDefinitionId">Question</Label>
                    <Select name="questionDefinitionId" required>
                      <SelectTrigger
                        id="questionDefinitionId"
                        className="w-72"
                      >
                        <SelectValue placeholder="Pick a question" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableQuestions.map((question) => (
                          <SelectItem key={question.id} value={question.id}>
                            {question.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      name="points"
                      type="number"
                      min={1}
                      defaultValue={3}
                      required
                      className="w-24"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="required" name="required" defaultChecked />
                    <Label htmlFor="required" className="font-normal">
                      Required
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="active" name="active" defaultChecked />
                    <Label htmlFor="active" className="font-normal">
                      Active
                    </Label>
                  </div>
                  <Button type="submit" className="w-fit">
                    Add
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {season.seasonQuestions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No questions added yet.
            </p>
          )}
          {season.seasonQuestions.map((seasonQuestion) => (
            <Card key={seasonQuestion.id}>
              <CardContent>
                {isDraft ? (
                  <form
                    action={updateSeasonQuestion.bind(
                      null,
                      seasonQuestion.id,
                    )}
                    className="flex flex-wrap items-end gap-4"
                  >
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="font-medium">
                        {seasonQuestion.questionDefinition.text}
                      </span>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {
                            answerTypeTagLabels[
                              seasonQuestion.questionDefinition.answerType
                            ]
                          }
                        </Badge>
                        <Badge variant="outline">
                          {
                            scoringStrategyTagLabels[
                              seasonQuestion.questionDefinition
                                .scoringStrategy
                            ]
                          }
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`order-${seasonQuestion.id}`}>
                        Order
                      </Label>
                      <Input
                        id={`order-${seasonQuestion.id}`}
                        name="order"
                        type="number"
                        min={1}
                        defaultValue={seasonQuestion.order}
                        className="w-20"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`points-${seasonQuestion.id}`}>
                        Points
                      </Label>
                      <Input
                        id={`points-${seasonQuestion.id}`}
                        name="points"
                        type="number"
                        min={1}
                        defaultValue={seasonQuestion.points}
                        className="w-20"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`required-${seasonQuestion.id}`}
                        name="required"
                        defaultChecked={seasonQuestion.required}
                      />
                      <Label
                        htmlFor={`required-${seasonQuestion.id}`}
                        className="font-normal"
                      >
                        Required
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`active-${seasonQuestion.id}`}
                        name="active"
                        defaultChecked={seasonQuestion.active}
                      />
                      <Label
                        htmlFor={`active-${seasonQuestion.id}`}
                        className="font-normal"
                      >
                        Active
                      </Label>
                    </div>
                    <Button type="submit" variant="outline">
                      Save
                    </Button>
                    <ConfirmSubmitButton
                      type="submit"
                      variant="destructive"
                      formAction={removeSeasonQuestion.bind(
                        null,
                        seasonQuestion.id,
                      )}
                      confirmMessage={`Remove "${seasonQuestion.questionDefinition.text}" from this season?`}
                    >
                      Remove
                    </ConfirmSubmitButton>
                  </form>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {seasonQuestion.order}.{" "}
                        {seasonQuestion.questionDefinition.text}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {
                            answerTypeTagLabels[
                              seasonQuestion.questionDefinition.answerType
                            ]
                          }
                        </Badge>
                        <Badge variant="outline">
                          {
                            scoringStrategyTagLabels[
                              seasonQuestion.questionDefinition
                                .scoringStrategy
                            ]
                          }
                        </Badge>
                        <Badge variant="outline">
                          {seasonQuestion.points} pts
                        </Badge>
                        {!seasonQuestion.required && (
                          <Badge variant="outline">Optional</Badge>
                        )}
                        {!seasonQuestion.active && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
