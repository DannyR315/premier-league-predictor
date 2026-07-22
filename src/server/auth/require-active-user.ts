import "server-only";
import { auth } from "@/lib/auth";

export async function requireActiveUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "ACTIVE") {
    throw new Error("Forbidden");
  }
  return session.user;
}
