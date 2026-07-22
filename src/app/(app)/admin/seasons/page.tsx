import Link from "next/link";
import { getSeasons } from "@/server/seasons/queries";
import { createSeason } from "@/server/seasons/mutations";
import {
  getEffectiveStatus,
  seasonStatusLabels,
  seasonStatusBadgeVariant,
} from "@/server/seasons/lifecycle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function SeasonsAdminPage() {
  const seasons = await getSeasons();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Seasons</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Each season starts as a draft — add questions from the bank, then
          open it once you&apos;re ready for predictions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create season</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSeason} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                name="label"
                placeholder="e.g. 2026/27"
                required
                className="max-w-40"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="startDate">Season start date</Label>
                <Input id="startDate" name="startDate" type="date" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="endDate">Season end date (optional)</Label>
                <Input id="endDate" name="endDate" type="date" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="predictionsLockAt">Predictions lock at</Label>
                <Input
                  id="predictionsLockAt"
                  name="predictionsLockAt"
                  type="datetime-local"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-fit">
              Create season
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {seasons.length === 0 && (
          <p className="text-sm text-muted-foreground">No seasons yet.</p>
        )}
        {seasons.map((season) => {
          const effectiveStatus = getEffectiveStatus(season);
          return (
            <Link key={season.id} href={`/admin/seasons/${season.id}`}>
              <Card className="transition-shadow hover:shadow-lg">
                <CardContent className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {season.competition.name} {season.label}
                    </span>
                    <Badge variant={seasonStatusBadgeVariant[effectiveStatus]}>
                      {seasonStatusLabels[effectiveStatus]}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {season._count.seasonQuestions} question
                    {season._count.seasonQuestions === 1 ? "" : "s"} ·{" "}
                    {season._count.predictions} prediction
                    {season._count.predictions === 1 ? "" : "s"}
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
