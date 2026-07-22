import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSeasonForPrediction,
  getRevealedPredictions,
} from "@/server/predictions/queries";
import { getEffectiveStatus, seasonStatusLabels } from "@/server/seasons/lifecycle";
import { checkAndNotifyPredictionsLocked } from "@/server/seasons/mutations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function SeasonPredictionsPage({
  params,
}: {
  params: Promise<{ seasonId: string }>;
}) {
  const { seasonId } = await params;
  const season = await getSeasonForPrediction(seasonId);
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

  const predictions = await getRevealedPredictions(seasonId);

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
        {(effectiveStatus === "ENDED" || effectiveStatus === "COMPLETED") && (
          <Link
            href={`/seasons/${seasonId}/leaderboard`}
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            View leaderboard →
          </Link>
        )}
      </div>

      {predictions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nobody submitted a prediction this season.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {predictions.map((prediction) => (
            <Link
              key={prediction.id}
              href={`/seasons/${seasonId}/predictions/${prediction.userId}`}
            >
              <Card className="transition-shadow hover:shadow-lg">
                <CardContent className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={prediction.user.avatarUrl ?? undefined}
                      alt={prediction.user.username}
                    />
                    <AvatarFallback>
                      {prediction.user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{prediction.user.username}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
