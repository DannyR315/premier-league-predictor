import { getQuestionDefinitions } from "@/server/questions/queries";
import {
  createQuestionDefinition,
  deleteQuestionDefinition,
  updateQuestionDefinition,
} from "@/server/questions/mutations";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import {
  answerTypeLabels,
  answerTypeTagLabels,
  scoringStrategyLabels,
  scoringStrategyTagLabels,
} from "@/server/questions/validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";

const answerTypeEntries = Object.entries(answerTypeLabels) as [
  keyof typeof answerTypeLabels,
  string,
][];
const scoringStrategyEntries = Object.entries(scoringStrategyLabels) as [
  keyof typeof scoringStrategyLabels,
  string,
][];

export default async function QuestionsAdminPage() {
  const questions = await getQuestionDefinitions();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Question bank</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reusable question templates. Adding one here doesn&apos;t put it in
          any season — a season is assembled by picking questions from this
          bank and setting per-season order, points, and required/active.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add question</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={createQuestionDefinition}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="text">Question text</Label>
              <Textarea id="text" name="text" required rows={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="answerType">Answer type</Label>
                <Select name="answerType" defaultValue="TEAM">
                  <SelectTrigger id="answerType" className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {answerTypeEntries.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scoringStrategy">Scoring strategy</Label>
                <Select name="scoringStrategy" defaultValue="EXACT_MATCH">
                  <SelectTrigger id="scoringStrategy" className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scoringStrategyEntries.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="selectionCount">Selection count</Label>
                <Input
                  id="selectionCount"
                  name="selectionCount"
                  type="number"
                  min={1}
                  placeholder="e.g. 5"
                  className="w-28"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Selection count only applies to Multiple Teams questions — e.g.
              5 for &quot;top 5 finishers&quot;, 3 for &quot;relegated
              teams&quot;.
            </p>
            <Button type="submit" className="w-fit">
              Add question
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {questions.length} question{questions.length === 1 ? "" : "s"}
        </h2>

        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No questions yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {questions.map((question) => (
              <Card key={question.id} className="py-0">
                <Collapsible>
                  <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <span className="font-medium">{question.text}</span>
                      <Badge variant="secondary">
                        {answerTypeTagLabels[question.answerType]}
                      </Badge>
                      <Badge variant="outline">
                        {scoringStrategyTagLabels[question.scoringStrategy]}
                      </Badge>
                      {question.selectionCount && (
                        <Badge variant="outline">
                          pick {question.selectionCount}
                        </Badge>
                      )}
                    </div>
                    <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/trigger:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="border-t pt-4">
                      <form
                        action={updateQuestionDefinition.bind(
                          null,
                          question.id,
                        )}
                        className="flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={`text-${question.id}`}>
                            Question text
                          </Label>
                          <Textarea
                            id={`text-${question.id}`}
                            name="text"
                            defaultValue={question.text}
                            required
                            rows={2}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label htmlFor={`description-${question.id}`}>
                            Description (optional)
                          </Label>
                          <Textarea
                            id={`description-${question.id}`}
                            name="description"
                            defaultValue={question.description ?? ""}
                            rows={2}
                          />
                        </div>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`answerType-${question.id}`}>
                              Answer type
                            </Label>
                            <Select
                              name="answerType"
                              defaultValue={question.answerType}
                              disabled={question._count.seasonQuestions > 0}
                            >
                              <SelectTrigger
                                id={`answerType-${question.id}`}
                                className="w-56"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {answerTypeEntries.map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`scoringStrategy-${question.id}`}>
                              Scoring strategy
                            </Label>
                            <Select
                              name="scoringStrategy"
                              defaultValue={question.scoringStrategy}
                              disabled={question._count.seasonQuestions > 0}
                            >
                              <SelectTrigger
                                id={`scoringStrategy-${question.id}`}
                                className="w-56"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {scoringStrategyEntries.map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <Label htmlFor={`selectionCount-${question.id}`}>
                              Selection count
                            </Label>
                            <Input
                              id={`selectionCount-${question.id}`}
                              name="selectionCount"
                              type="number"
                              min={1}
                              defaultValue={question.selectionCount ?? ""}
                              disabled={question._count.seasonQuestions > 0}
                              className="w-28"
                            />
                          </div>
                        </div>
                        {question._count.seasonQuestions > 0 && (
                          <>
                            {/* Disabled fields are excluded from FormData on
                            submit, so these carry the locked values through
                            instead. */}
                            <input
                              type="hidden"
                              name="answerType"
                              value={question.answerType}
                            />
                            <input
                              type="hidden"
                              name="scoringStrategy"
                              value={question.scoringStrategy}
                            />
                            {question.selectionCount && (
                              <input
                                type="hidden"
                                name="selectionCount"
                                value={question.selectionCount}
                              />
                            )}
                            <p className="text-xs text-muted-foreground">
                              Answer type, scoring strategy, and selection
                              count are locked once a question is used in a
                              season — only the wording can still be edited.
                            </p>
                          </>
                        )}
                        <div className="flex items-center gap-3">
                          <Button
                            type="submit"
                            variant="outline"
                            className="w-fit"
                          >
                            Save
                          </Button>
                          {question._count.seasonQuestions > 0 ? (
                            <span className="text-xs text-muted-foreground">
                              Used in {question._count.seasonQuestions} season
                              {question._count.seasonQuestions === 1
                                ? ""
                                : "s"}{" "}
                              — can&apos;t delete
                            </span>
                          ) : (
                            <ConfirmSubmitButton
                              type="submit"
                              variant="destructive"
                              className="w-fit"
                              formAction={deleteQuestionDefinition.bind(
                                null,
                                question.id,
                              )}
                              confirmMessage={`Delete "${question.text}"? This can't be undone.`}
                            >
                              Delete
                            </ConfirmSubmitButton>
                          )}
                        </div>
                      </form>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
