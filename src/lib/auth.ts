import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import type { DiscordProfile } from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";

const initialAdminDiscordIds = (process.env.INITIAL_ADMIN_DISCORD_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

/**
 * No adapter here on purpose: our User model doesn't match Auth.js's default
 * adapter schema (name/image/emailVerified) — it has its own discordId/role/status
 * shape, and authorization is meant to live entirely in our own database. We only
 * ever have one provider and use JWT sessions, so there's nothing an adapter would
 * buy us (no multi-provider linking, no magic-link tokens, no DB session rows).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [Discord],
  callbacks: {
    async signIn({ account, profile }) {
      if (!account || account.provider !== "discord" || !profile) return false;

      const discordProfile = profile as DiscordProfile;
      const discordId = account.providerAccountId;
      const isBootstrapAdmin = initialAdminDiscordIds.includes(discordId);

      await prisma.user.upsert({
        where: { discordId },
        update: {
          username: discordProfile.username,
          avatarUrl: discordProfile.image_url ?? null,
        },
        create: {
          discordId,
          username: discordProfile.username,
          avatarUrl: discordProfile.image_url ?? null,
          email: discordProfile.email ?? null,
          role: isBootstrapAdmin ? "ADMIN" : "PLAYER",
          status: isBootstrapAdmin ? "ACTIVE" : "PENDING",
        },
      });

      return true;
    },

    async jwt({ token, account }) {
      // `account` is only present on the sign-in request, not subsequent ones
      if (account) {
        const dbUser = await prisma.user.findUnique({
          where: { discordId: account.providerAccountId },
          select: { id: true },
        });
        if (dbUser) token.userId = dbUser.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (typeof token.userId !== "string") return session;

      // Re-fetched from the DB on every request (not cached in the token) so an
      // admin approving/revoking/promoting a user takes effect immediately,
      // rather than waiting for the JWT to be reissued.
      const dbUser = await prisma.user.findUnique({
        where: { id: token.userId },
      });

      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.role = dbUser.role;
        session.user.status = dbUser.status;
        session.user.username = dbUser.username;
        session.user.avatarUrl = dbUser.avatarUrl;
      }

      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
