import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeasonForPrediction } from "@/server/predictions/queries";
import { getSeasonLeaderboard } from "@/server/scoring/queries";
import { getEffectiveStatus, seasonStatusLabels } from "@/server/seasons/lifecycle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function SeasonLeaderboardPage({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const season = await getSeasonForPrediction(seasonId);
  if (!season) notFound();

  const effectiveStatus = getEffectiveStatus(season);
  if (effectiveStatus === "OPEN" || effectiveStatus === "DRAFT") {
    return (
      <p className="text-muted-foreground">
        The leaderboard shows up once the season locks — currently{" "}
        <Badge variant="outline">{seasonStatusLabels[effectiveStatus]}</Badge>.
      </p>
    );
  }

  const predictions = await getSeasonLeaderboard(seasonId);

  const standings = predictions
    .map((prediction) => ({
      prediction,
      total: prediction.answers.reduce(
        (sum, answer) => sum + (answer.scoringResult?.points ?? 0),
        0,
      ),
    }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {season.competition.name} {season.label} — Leaderboard
        </h1>
        {season.status !== "COMPLETED" && (
          <p className="mt-1 text-sm text-muted-foreground">
            Provisional — scores fill in as the admin finalizes each
            question.
          </p>
        )}
      </div>

      {standings.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nobody submitted a prediction this season.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {standings.map(({ prediction, total }) => {
            const rank =
              1 + standings.filter((s) => s.total > total).length;
            return (
              <Link
                key={prediction.id}
                href={`/seasons/${seasonId}/predictions/${prediction.userId}`}
              >
                <Card className="transition-shadow hover:shadow-lg">
                  <CardContent className="flex items-center gap-4">
                    <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                      {rank}
                    </span>
                    <Avatar>
                      <AvatarImage
                        src={prediction.user.avatarUrl ?? undefined}
                        alt={prediction.user.username}
                      />
                      <AvatarFallback>
                        {prediction.user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 font-medium">
                      {prediction.user.username}
                    </span>
                    <span className="text-sm font-semibold">
                      {total} pt{total === 1 ? "" : "s"}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
