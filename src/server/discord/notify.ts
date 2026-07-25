import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Fire-and-forget: a failed Discord notification should never break the
 * actual save it's announcing. Posts through the same bot that backs
 * /pl-predictor (not a channel webhook), so every message in the server
 * comes from one identity. DISCORD_BOT_TOKEN/DISCORD_CHANNEL_ID are
 * optional — if either is unset, this silently does nothing. The bot's
 * role needs "Send Messages" (and "View Channel") permission in that
 * channel — granted via Server Settings -> Roles in Discord, not via the
 * developer portal.
 */
export async function notifyDiscord(content: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!token || !channelId) return;

  try {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      },
    );
    if (!res.ok) {
      console.error(`Discord bot message failed (${res.status})`, await res.text());
    }
  } catch (err) {
    console.error("Discord bot message failed", err);
  }
}

/**
 * Fire-and-forget, same reasoning as notifyDiscord above — DMs every
 * current admin (not just the INITIAL_ADMIN_DISCORD_IDS bootstrap set, so
 * this stays correct as admins are added/removed later) when someone new
 * signs in and lands as PENDING. Discord only allows a bot to DM users it
 * shares a server with, and a recipient can have DMs from server members
 * disabled entirely — either way this just silently does nothing rather
 * than surfacing an error.
 */
export async function notifyAdminsOfPendingUser(username: string) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return;

  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", status: "ACTIVE" },
      select: { discordId: true },
    });

    await Promise.all(
      admins.map((admin) =>
        dmDiscordUser(
          token,
          admin.discordId,
          `👋 **${username}** just signed in and is waiting for approval.`,
        ),
      ),
    );
  } catch (err) {
    console.error("Pending-user DM notification failed", err);
  }
}

async function dmDiscordUser(token: string, discordId: string, content: string) {
  try {
    const channelRes = await fetch(
      "https://discord.com/api/v10/users/@me/channels",
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient_id: discordId }),
      },
    );
    if (!channelRes.ok) {
      console.error(`Discord DM channel creation failed (${channelRes.status})`);
      return;
    }
    const channel: { id: string } = await channelRes.json();

    const messageRes = await fetch(
      `https://discord.com/api/v10/channels/${channel.id}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      },
    );
    if (!messageRes.ok) {
      console.error(`Discord DM send failed (${messageRes.status})`);
    }
  } catch (err) {
    console.error("Discord DM failed", err);
  }
}
