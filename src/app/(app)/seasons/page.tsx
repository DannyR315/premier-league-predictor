import Link from "next/link";
import { Suspense } from "react";
import { getVisibleSeasons } from "@/server/predictions/queries";
import {
  getEffectiveStatus,
  seasonStatusLabels,
  seasonStatusBadgeVariant,
} from "@/server/seasons/lifecycle";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SavedToast } from "@/components/predictions/saved-toast";

export default async function SeasonsPage() {
  const seasons = await getVisibleSeasons();

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <SavedToast />
      </Suspense>
      <h1 className="text-2xl font-semibold">Seasons</h1>

      {seasons.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No seasons are open yet — check back once an admin publishes one.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {seasons.map((season) => {
            const effectiveStatus = getEffectiveStatus(season);
            const href =
              effectiveStatus === "OPEN"
                ? `/seasons/${season.id}/predict`
                : `/seasons/${season.id}/predictions`;
            return (
              <Link key={season.id} href={href}>
                <Card className="transition-shadow hover:shadow-lg">
                  <CardContent className="flex items-center justify-between gap-4">
                    <span className="font-medium">
                      {season.competition.name} {season.label}
                    </span>
                    <Badge variant={seasonStatusBadgeVariant[effectiveStatus]}>
                      {seasonStatusLabels[effectiveStatus]}
                    </Badge>
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
