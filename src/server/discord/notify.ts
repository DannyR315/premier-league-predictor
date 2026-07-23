import "server-only";

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
