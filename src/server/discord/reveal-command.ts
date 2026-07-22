import "server-only";
import { prisma } from "@/lib/prisma";
import { getEffectiveStatus } from "@/server/seasons/lifecycle";
import { formatAnswerValue } from "@/server/predictions/format-answer";

type RevealResult =
  | {
      ok: true;
      seasonLabel: string;
      questionText: string;
      username: string;
      answerText: string;
    }
  | { ok: false; message: string };

/**
 * Backs the `/pl-predictor` Discord slash command. Only ever looks at the
 * most recently created season that isn't DRAFT/OPEN, mirroring the app's
 * own "hidden until locked" rule — there's no way to reveal a prediction
 * before the season it belongs to has actually locked.
 */
export async function getRevealAnswer(
  discordUserId: string,
  questionOrder: number,
): Promise<RevealResult> {
  const user = await prisma.user.findUnique({
    where: { discordId: discordUserId },
  });
  if (!user) {
    return {
      ok: false,
      message: "That user hasn't signed into the predictor app.",
    };
  }

  const candidateSeasons = await prisma.season.findMany({
    where: { status: { not: "DRAFT" } },
    orderBy: { createdAt: "desc" },
  });
  const season = candidateSeasons.find((s) =>
    ["LOCKED", "ENDED", "COMPLETED"].includes(getEffectiveStatus(s)),
  );
  if (!season) {
    return { ok: false, message: "No predictions have locked yet." };
  }

  const seasonQuestion = await prisma.seasonQuestion.findFirst({
    where: { seasonId: season.id, active: true, order: questionOrder },
    include: { questionDefinition: true },
  });
  if (!seasonQuestion) {
    return {
      ok: false,
      message: `Question ${questionOrder} doesn't exist for ${season.label}.`,
    };
  }

  const prediction = await prisma.prediction.findUnique({
    where: { seasonId_userId: { seasonId: season.id, userId: user.id } },
  });
  if (!prediction) {
    return {
      ok: false,
      message: `${user.username} didn't submit a prediction for ${season.label}.`,
    };
  }

  const answer = await prisma.predictionAnswer.findUnique({
    where: {
      predictionId_seasonQuestionId: {
        predictionId: prediction.id,
        seasonQuestionId: seasonQuestion.id,
      },
    },
    include: { club: true, manager: true, multiClubs: { include: { club: true } } },
  });

  const answerText = formatAnswerValue(
    answer,
    seasonQuestion.questionDefinition.answerType,
  );
  if (answerText === "No answer") {
    return { ok: false, message: `${user.username} didn't answer that question.` };
  }

  return {
    ok: true,
    seasonLabel: season.label,
    questionText: seasonQuestion.questionDefinition.text,
    username: user.username,
    answerText,
  };
}
