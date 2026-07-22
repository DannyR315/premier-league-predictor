import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPredictionDetail } from "@/server/predictions/queries";
import { formatAnswerValue } from "@/server/predictions/format-answer";
import { getEffectiveStatus, seasonStatusLabels } from "@/server/seasons/lifecycle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnswerReactions } from "@/components/predictions/answer-reactions";

export default async function PredictionDetailPage({
  params,
}: {
  params: Promise<{ seasonId: string; userId: string }>;
}) {
  const { seasonId, userId } = await params;
  const session = await auth();
  const prediction = await getPredictionDetail(seasonId, userId);
  if (!prediction) notFound();

  const effectiveStatus = getEffectiveStatus(prediction.season);
  if (effectiveStatus === "OPEN" || effectiveStatus === "DRAFT") {
    return (
      <p className="text-muted-foreground">
        Predictions stay hidden until the season locks — currently{" "}
        <Badge variant="outline">{seasonStatusLabels[effectiveStatus]}</Badge>.
      </p>
    );
  }

  const answersBySeasonQuestionId = new Map(
    prediction.answers.map((answer) => [answer.seasonQuestionId, answer]),
  );

  return (
    <div className="flex flex-col gap-6">
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
        <div>
          <h1 className="text-xl font-semibold">
            {prediction.user.username}&apos;s predictions
          </h1>
          <p className="text-sm text-muted-foreground">
            {prediction.season.label}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {prediction.season.seasonQuestions.map((seasonQuestion) => {
          const answer = answersBySeasonQuestionId.get(seasonQuestion.id);
          return (
            <Card key={seasonQuestion.id} className="group relative">
              <CardContent className="flex flex-col gap-3 pt-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm">
                    {seasonQuestion.order}.{" "}
                    {seasonQuestion.questionDefinition.text}
                  </span>
                  <span className="font-medium">
                    {formatAnswerValue(
                      answer ?? null,
                      seasonQuestion.questionDefinition.answerType,
                    )}
                  </span>
                </div>
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
