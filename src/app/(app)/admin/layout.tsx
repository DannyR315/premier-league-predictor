import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const navLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/seasons", label: "Seasons" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/football/clubs", label: "Clubs" },
  { href: "/admin/football/managers", label: "Managers" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/seasons");

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex w-fit gap-1 rounded-full border bg-card p-1 text-sm shadow-sm">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full px-3.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
