import "server-only";
import { auth } from "@/lib/auth";

/**
 * Every mutation must call this itself rather than trusting the admin layout's
 * redirect — a Server Action is a separate entry point (reachable directly via
 * POST) and the layout's check doesn't extend to it.
 */
export async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN" || session.user.status !== "ACTIVE") {
    throw new Error("Forbidden");
  }
  return session.user;
}
