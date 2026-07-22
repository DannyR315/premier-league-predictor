// Registers/updates the /pl-predictor slash command with Discord. Re-run
// this whenever the command's name, description, or options change — Discord
// doesn't pick up definition changes from the interactions endpoint itself.
//
// Usage:
//   set -a && source .env && set +a && node scripts/register-discord-command.mjs

const applicationId = process.env.AUTH_DISCORD_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;

if (!applicationId || !botToken) {
  console.error("Missing AUTH_DISCORD_ID or DISCORD_BOT_TOKEN in the environment.");
  process.exit(1);
}

const command = {
  name: "pl-predictor",
  description: "Reveal a friend's prediction for a locked question",
  options: [
    {
      name: "user",
      description: "Whose prediction to reveal",
      type: 6, // USER
      required: true,
    },
    {
      name: "question",
      description: "Question number, as shown on the predictions page",
      type: 4, // INTEGER
      required: true,
      min_value: 1,
    },
  ],
};

// Guild-scoped registration applies instantly; global registration can take
// up to an hour to propagate. This is a single-server bot, so guild-scoped
// (DISCORD_GUILD_ID set) is the expected path.
const url = guildId
  ? `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`
  : `https://discord.com/api/v10/applications/${applicationId}/commands`;

const res = await fetch(url, {
  method: "PUT",
  headers: {
    Authorization: `Bot ${botToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify([command]),
});

if (!res.ok) {
  console.error(`Failed: ${res.status} ${res.statusText}`);
  console.error(await res.text());
  process.exit(1);
}

console.log(
  guildId
    ? `Registered /pl-predictor for guild ${guildId} (instant).`
    : "Registered /pl-predictor globally (may take up to an hour to appear).",
);
