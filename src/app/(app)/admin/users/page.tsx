import { auth } from "@/lib/auth";
import { getUsers } from "@/server/users/queries";
import {
  approveUser,
  toggleAdminRole,
  revokeUser,
  reactivateUser,
} from "@/server/users/mutations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import type { User } from "@prisma/client";

function Identity({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={user.avatarUrl ?? undefined} alt={user.username} />
        <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium">{user.username}</span>
        {user.email && (
          <span className="text-sm text-muted-foreground">{user.email}</span>
        )}
      </div>
    </div>
  );
}

export default async function UsersAdminPage() {
  const [users, session] = await Promise.all([getUsers(), auth()]);
  const currentUserId = session?.user?.id;

  const pending = users.filter((u) => u.status === "PENDING");
  const active = users.filter((u) => u.status === "ACTIVE");
  const revoked = users.filter((u) => u.status === "REVOKED");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Anyone who signs in with Discord lands here as pending until an
          admin approves them — Discord membership alone never grants access.
        </p>
      </div>

      {pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Pending approval ({pending.length})
          </h2>
          {pending.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <Identity user={user} />
                <form
                  action={approveUser.bind(null, user.id)}
                  className="flex items-center gap-2"
                >
                  <Select name="role" defaultValue="PLAYER">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLAYER">Player</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit">Approve</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Active ({active.length})
        </h2>
        {active.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <Card key={user.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Identity user={user} />
                  <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                    {user.role === "ADMIN" ? "Admin" : "Player"}
                  </Badge>
                  {isSelf && (
                    <span className="text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                </div>
                {!isSelf && (
                  <div className="flex gap-2">
                    <form action={toggleAdminRole.bind(null, user.id)}>
                      <Button type="submit" variant="outline">
                        {user.role === "ADMIN" ? "Remove admin" : "Make admin"}
                      </Button>
                    </form>
                    <form action={revokeUser.bind(null, user.id)}>
                      <ConfirmSubmitButton
                        type="submit"
                        variant="destructive"
                        confirmMessage={`Revoke access for ${user.username}?`}
                      >
                        Revoke
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      {revoked.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Revoked ({revoked.length})
          </h2>
          {revoked.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4">
                <Identity user={user} />
                <form action={reactivateUser.bind(null, user.id)}>
                  <Button type="submit" variant="outline">
                    Reactivate
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
