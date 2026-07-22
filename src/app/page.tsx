import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInButton } from "@/components/auth/sign-in-button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.status === "ACTIVE") {
    redirect("/seasons");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>PL Predictor</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!session?.user && (
            <>
              <p className="text-sm text-muted-foreground">
                Sign in with Discord to submit your predictions.
              </p>
              <SignInButton />
            </>
          )}

          {session?.user?.status === "PENDING" && (
            <>
              <p className="text-sm text-muted-foreground">
                Signed in as {session.user.username}. Your access is awaiting
                admin approval.
              </p>
              <SignOutButton />
            </>
          )}

          {session?.user?.status === "REVOKED" && (
            <>
              <p className="text-sm text-muted-foreground">
                Your access has been revoked. Contact an admin if you think
                this is a mistake.
              </p>
              <SignOutButton />
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
