import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.status !== "ACTIVE") redirect("/");

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-card shadow-sm shadow-black/[0.03] dark:shadow-black/20">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/seasons" className="font-semibold text-primary">
              PL Predictor
            </Link>
            {session.user.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-full px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Admin
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.username}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </div>
    </div>
  );
}
