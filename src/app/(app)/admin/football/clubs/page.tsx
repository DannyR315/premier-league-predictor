import { getClubs } from "@/server/football/queries";
import { createClub, updateClub, deleteClub } from "@/server/football/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export default async function ClubsAdminPage() {
  const clubs = await getClubs();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Clubs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add club</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createClub} className="flex max-w-md flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shortName">Short name</Label>
              <Input id="shortName" name="shortName" placeholder="e.g. ARS" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="crestUrl">Crest URL</Label>
              <Input id="crestUrl" name="crestUrl" type="url" />
            </div>
            <Button type="submit">Add club</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {clubs.length === 0 && (
          <p className="text-sm text-muted-foreground">No clubs yet.</p>
        )}
        {clubs.map((club) => {
          const inUse =
            club._count.predictionAnswers +
              club._count.predictionAnswerMulti +
              club._count.seasonResults +
              club._count.seasonResultMulti >
            0;
          return (
            <Card key={club.id}>
              <CardContent className="pt-6">
                <form
                  action={updateClub.bind(null, club.id)}
                  className="flex flex-wrap items-end gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`name-${club.id}`}>Name</Label>
                    <Input
                      id={`name-${club.id}`}
                      name="name"
                      defaultValue={club.name}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`shortName-${club.id}`}>Short name</Label>
                    <Input
                      id={`shortName-${club.id}`}
                      name="shortName"
                      defaultValue={club.shortName ?? ""}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`crestUrl-${club.id}`}>Crest URL</Label>
                    <Input
                      id={`crestUrl-${club.id}`}
                      name="crestUrl"
                      defaultValue={club.crestUrl ?? ""}
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    Save
                  </Button>
                  {inUse ? (
                    <span className="text-xs text-muted-foreground">
                      Used in a prediction/result — can&apos;t delete
                    </span>
                  ) : (
                    <ConfirmSubmitButton
                      type="submit"
                      variant="destructive"
                      formAction={deleteClub.bind(null, club.id)}
                      confirmMessage={`Delete ${club.name}?`}
                    >
                      Delete
                    </ConfirmSubmitButton>
                  )}
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
