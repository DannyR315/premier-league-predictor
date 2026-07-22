import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Cheap, session-only gate: is anyone signed in at all? Role/status checks
 * (pending approval, revoked, admin-only) live in layouts instead, closer to
 * the pages they protect. Every Server Action still re-checks auth itself too —
 * this proxy is a convenience redirect, not the security boundary.
 */
export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
