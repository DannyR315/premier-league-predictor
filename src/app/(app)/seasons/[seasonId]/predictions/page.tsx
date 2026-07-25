import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getSeasonForPrediction,
  getRevealedPredictionsWithAnswers,
} from "@/server/predictions/queries";
import { formatAnswerValue } from "@/server/predictions/format-answer";
import { getEffectiveStatus, seasonStatusLabels } from "@/server/seasons/lifecycle";
import { checkAndNotifyPredictionsLocked } from "@/server/seasons/mutations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnswerReactions } from "@/components/predictions/answer-reactions";
import { userCardRingClass } from "@/lib/user-card-color";
import { cn } from "@/lib/utils";

export default async function SeasonPredictionsPage({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const [season, session] = await Promise.all([
    getSeasonForPrediction(seasonId),
    auth(),
  ]);
  if (!season) notFound();

  const effectiveStatus = getEffectiveStatus(season);

  if (effectiveStatus === "LOCKED") {
    checkAndNotifyPredictionsLocked(seasonId).catch((err) =>
      console.error("Lock notification check failed", err),
    );
  }

  if (effectiveStatus === "OPEN" || effectiveStatus === "DRAFT") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">
          {season.competition.name} {season.label}
        </h1>
        <p className="text-muted-foreground">
          Predictions stay hidden until the season locks — currently{" "}
          <Badge variant="outline">{seasonStatusLabels[effectiveStatus]}</Badge>.
        </p>
      </div>
    );
  }

  const predictions = await getRevealedPredictionsWithAnswers(seasonId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {season.competition.name} {season.label}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {predictions.length} prediction{predictions.length === 1 ? "" : "s"}{" "}
          submitted
        </p>
      </div>

      {predictions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nobody submitted a prediction this season.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {predictions.map((prediction) => {
            const answersBySeasonQuestionId = new Map(
              prediction.answers.map((answer) => [
                answer.seasonQuestionId,
                answer,
              ]),
            );

            return (
              <Card
                key={prediction.id}
                className={cn(
                  "overflow-visible ring-2",
                  userCardRingClass(prediction.userId),
                )}
              >
                <CardHeader className="sticky top-0 z-10 rounded-t-lg border-b bg-card">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={prediction.user.avatarUrl ?? undefined}
                        alt={prediction.user.username}
                      />
                      <AvatarFallback>
                        {prediction.user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {prediction.user.username}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {season.seasonQuestions.map((seasonQuestion) => {
                    const answer = answersBySeasonQuestionId.get(
                      seasonQuestion.id,
                    );
                    return (
                      <div
                        key={seasonQuestion.id}
                        className="group relative flex flex-col gap-1.5 border-t pt-3 first:border-t-0 first:pt-0"
                      >
                        <span className="text-xs text-muted-foreground">
                          {seasonQuestion.order}.{" "}
                          {seasonQuestion.questionDefinition.text}
                        </span>
                        <span className="text-sm font-medium whitespace-pre-line">
                          {formatAnswerValue(
                            answer ?? null,
                            seasonQuestion.questionDefinition.answerType,
                          )}
                        </span>
                        {answer && (
                          <AnswerReactions
                            predictionAnswerId={answer.id}
                            reactions={answer.reactions.map((reaction) => ({
                              emoji: reaction.emoji,
                              userId: reaction.userId,
                              username: reaction.user.username,
                            }))}
                            currentUserId={session?.user?.id}
                            currentUsername={session?.user?.username}
                          />
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
