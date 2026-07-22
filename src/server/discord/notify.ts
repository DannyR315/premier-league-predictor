import "server-only";

/**
 * Fire-and-forget: a failed Discord notification should never break the
 * actual save it's announcing. DISCORD_WEBHOOK_URL is optional — if unset,
 * this silently does nothing.
 */
export async function notifyDiscord(content: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      console.error(`Discord webhook failed (${res.status})`);
    }
  } catch (err) {
    console.error("Discord webhook failed", err);
  }
}
