import { getClubs, getManagers } from "@/server/football/queries";
import {
  createManager,
  updateManager,
  deleteManager,
} from "@/server/football/mutations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export default async function ManagersAdminPage() {
  const [managers, clubs] = await Promise.all([getManagers(), getClubs()]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Managers</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add manager</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createManager} className="flex max-w-md flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" name="nationality" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentClubId">Current club</Label>
              <Combobox
                id="currentClubId"
                name="currentClubId"
                options={clubs}
                placeholder="No club"
                searchPlaceholder="Search teams..."
                className="w-full"
              />
            </div>
            <Button type="submit">Add manager</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {managers.length === 0 && (
          <p className="text-sm text-muted-foreground">No managers yet.</p>
        )}
        {managers.map((manager) => {
          const inUse =
            manager._count.predictionAnswers + manager._count.seasonResults >
            0;
          return (
            <Card key={manager.id}>
              <CardContent className="pt-6">
                <form
                  action={updateManager.bind(null, manager.id)}
                  className="flex flex-wrap items-end gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`name-${manager.id}`}>Name</Label>
                    <Input
                      id={`name-${manager.id}`}
                      name="name"
                      defaultValue={manager.name}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`nationality-${manager.id}`}>
                      Nationality
                    </Label>
                    <Input
                      id={`nationality-${manager.id}`}
                      name="nationality"
                      defaultValue={manager.nationality ?? ""}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`club-${manager.id}`}>Current club</Label>
                    <Combobox
                      id={`club-${manager.id}`}
                      name="currentClubId"
                      defaultValue={manager.currentClubId ?? undefined}
                      options={clubs}
                      placeholder="No club"
                      searchPlaceholder="Search teams..."
                      className="w-48"
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
                      formAction={deleteManager.bind(null, manager.id)}
                      confirmMessage={`Delete ${manager.name}?`}
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
