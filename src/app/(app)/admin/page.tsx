import Link from "next/link";
import { getPendingUserCount } from "@/server/users/queries";
import { getSeasons } from "@/server/seasons/queries";
import {
  getEffectiveStatus,
  seasonStatusLabels,
  seasonStatusBadgeVariant,
} from "@/server/seasons/lifecycle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminHomePage() {
  const [pendingCount, seasons] = await Promise.all([
    getPendingUserCount(),
    getSeasons(),
  ]);
  const latestSeason = seasons[0];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Admin</h1>

      {pendingCount > 0 && (
        <Link href="/admin/users">
          <Card className="border-primary/40 transition-shadow hover:shadow-lg">
            <CardContent className="flex items-center justify-between gap-4">
              <span className="font-medium">
                {pendingCount} sign-up{pendingCount === 1 ? "" : "s"} awaiting
                approval
              </span>
              <Badge>Review →</Badge>
            </CardContent>
          </Card>
        </Link>
      )}

      {latestSeason && (
        <Link href={`/admin/seasons/${latestSeason.id}`}>
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Most recent season</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <span className="font-medium">
                {latestSeason.competition.name} {latestSeason.label}
              </span>
              <Badge
                variant={
                  seasonStatusBadgeVariant[getEffectiveStatus(latestSeason)]
                }
              >
                {seasonStatusLabels[getEffectiveStatus(latestSeason)]}
              </Badge>
            </CardContent>
          </Card>
        </Link>
      )}

      <p className="text-sm text-muted-foreground">
        Manage seasons, the question bank, football reference data, and users
        via the links above.
      </p>
    </div>
  );
}
