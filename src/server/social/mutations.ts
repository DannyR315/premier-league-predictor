"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/server/auth/require-active-user";
import { getEffectiveStatus } from "@/server/seasons/lifecycle";
import { REACTION_EMOJIS } from "@/lib/reactions";

async function requireVisibleAnswer(predictionAnswerId: string) {
  const answer = await prisma.predictionAnswer.findUniqueOrThrow({
    where: { id: predictionAnswerId },
    include: { prediction: { include: { season: true } } },
  });

  if (getEffectiveStatus(answer.prediction.season) === "OPEN") {
    throw new Error("Predictions aren't visible until the season locks.");
  }

  return answer;
}

export async function toggleReaction(predictionAnswerId: string, emoji: string) {
  if (!REACTION_EMOJIS.includes(emoji as (typeof REACTION_EMOJIS)[number])) {
    throw new Error("Not a supported reaction.");
  }

  const user = await requireActiveUser();
  const answer = await requireVisibleAnswer(predictionAnswerId);

  const existing = await prisma.reaction.findUnique({
    where: {
      predictionAnswerId_userId_emoji: {
        predictionAnswerId,
        userId: user.id,
        emoji,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { predictionAnswerId, userId: user.id, emoji },
    });
  }

  revalidatePath(
    `/seasons/${answer.prediction.seasonId}/predictions/${answer.prediction.userId}`,
  );
}
