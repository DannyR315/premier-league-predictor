import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPredictionDetail } from "@/server/predictions/queries";
import { getEffectiveStatus, seasonStatusLabels } from "@/server/seasons/lifecycle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnswerReactions } from "@/components/predictions/answer-reactions";

function formatAnswer(
  answer:
    | NonNullable<
        Awaited<ReturnType<typeof getPredictionDetail>>
      >["answers"][number]
    | undefined,
  answerType: string,
) {
  if (!answer) return "No answer";

  switch (answerType) {
    case "TEAM":
      return answer.club?.name ?? "No answer";
    case "MANAGER":
      return answer.manager?.name ?? "No answer";
    case "MULTIPLE_TEAMS":
      return answer.multiClubs.length > 0
        ? answer.multiClubs.map((mc) => mc.club.name).join(", ")
        : "No answer";
    case "NUMBER":
    case "LEAGUE_POSITION":
      return answer.numberValue ?? "No answer";
    default:
      return answer.textValue ?? "No answer";
  }
}

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
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatAnswer(
                        answer,
                        seasonQuestion.questionDefinition.answerType,
                      )}
                    </span>
                    {answer?.scoringResult && (
                      <Badge variant={answer.scoringResult.points > 0 ? "default" : "outline"}>
                        {answer.scoringResult.points} pt
                        {answer.scoringResult.points === 1 ? "" : "s"}
                      </Badge>
                    )}
                  </div>
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
