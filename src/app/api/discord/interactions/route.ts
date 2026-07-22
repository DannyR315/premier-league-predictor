import { NextResponse } from "next/server";
import { after } from "next/server";
import {
  InteractionType,
  InteractionResponseType,
  verifyKey,
} from "discord-interactions";
import { getRevealAnswer } from "@/server/discord/reveal-command";

export const runtime = "nodejs";

const EPHEMERAL = 64;

type CommandOption = { name: string; value: string | number };

async function editOriginalResponse(
  applicationId: string,
  token: string,
  body: unknown,
) {
  await fetch(
    `https://discord.com/api/v10/webhooks/${applicationId}/${token}/messages/@original`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  const rawBody = await request.text();

  if (!signature || !timestamp || !publicKey) {
    return new NextResponse("Bad request signature", { status: 401 });
  }

  const isValid = await verifyKey(rawBody, signature, timestamp, publicKey);
  if (!isValid) {
    return new NextResponse("Bad request signature", { status: 401 });
  }

  const interaction = JSON.parse(rawBody);

  if (interaction.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  if (
    interaction.type === InteractionType.APPLICATION_COMMAND &&
    interaction.data?.name === "pl-predictor"
  ) {
    const options: CommandOption[] = interaction.data.options ?? [];
    const discordUserId = options.find((o) => o.name === "user")?.value;
    const questionOrder = options.find((o) => o.name === "question")?.value;

    if (typeof discordUserId !== "string" || typeof questionOrder !== "number") {
      return NextResponse.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "Missing user or question option.", flags: EPHEMERAL },
      });
    }

    const applicationId: string = interaction.application_id;
    const token: string = interaction.token;

    // Discord requires an ack within 3 seconds, but the DB lookup can take
    // longer than that (Supabase's free-tier pooler cold-starts after
    // idling). So we ack immediately with a "thinking" placeholder and use
    // `after()` — which Vercel keeps the function alive for via waitUntil —
    // to edit in the real answer once it's ready.
    after(async () => {
      const result = await getRevealAnswer(discordUserId, questionOrder);
      if (!result.ok) {
        await editOriginalResponse(applicationId, token, {
          content: result.message,
        });
        return;
      }
      await editOriginalResponse(applicationId, token, {
        embeds: [
          {
            title: `${result.seasonLabel} — Q${questionOrder}`,
            description: result.questionText,
            fields: [{ name: result.username, value: result.answerText }],
            color: 0x6366f1,
          },
        ],
      });
    });

    return NextResponse.json({
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
    });
  }

  return new NextResponse("Unknown interaction", { status: 400 });
}
