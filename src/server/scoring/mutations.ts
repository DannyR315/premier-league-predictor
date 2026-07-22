"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { AnswerType } from "@prisma/client";
import { requireAdmin } from "@/server/auth/require-admin";
import { formField } from "@/lib/form-data";
import { computeObjectiveScore, type ComparableAnswer } from "./strategies";

/**
 * Completed is included (not just Ended) so an admin can still correct a
 * mistake after the season auto-completes — otherwise finalizing the last
 * question locks out fixes to every earlier one, with no way back.
 * Re-submitting a result after completion just recomputes scores; it doesn't
 * change resultFinalizedAt or un-complete the season.
 */
async function requireResultsEditable(seasonId: string) {
  const season = await prisma.season.findUniqueOrThrow({
    where: { id: seasonId },
  });
  if (season.status !== "ENDED" && season.status !== "COMPLETED") {
    throw new Error("Results can only be entered once the season has ended.");
  }
  return season;
}

/**
 * Each question finalizes independently as its own result comes in (ground
 * truth for objective questions, all answers graded for manual review, or —
 * once built — voting closed for community vote). Once every active
 * question in the season has resultFinalizedAt set, the season completes
 * itself — no separate admin action needed for that transition.
 */
async function maybeCompleteSeason(seasonId: string) {
  const remaining = await prisma.seasonQuestion.count({
    where: { seasonId, active: true, resultFinalizedAt: null },
  });
  if (remaining === 0) {
    await prisma.season.update({
      where: { id: seasonId },
      data: { status: "COMPLETED" },
    });
  }
}

type GroundTruthInput = {
  clubId: string | null;
  managerId: string | null;
  numberValue: number | null;
  textValue: string | null;
  multiClubIds: string[];
};

function extractGroundTruth(
  formData: FormData,
  answerType: AnswerType,
): GroundTruthInput {
  const base: GroundTruthInput = {
    clubId: null,
    managerId: null,
    numberValue: null,
    textValue: null,
    multiClubIds: [],
  };

  switch (answerType) {
    case "TEAM":
      return { ...base, clubId: formField(formData, "clubId") ?? null };
    case "MANAGER":
      return { ...base, managerId: formField(formData, "managerId") ?? null };
    case "NUMBER":
    case "LEAGUE_POSITION": {
      const raw = formField(formData, "numberValue");
      return { ...base, numberValue: raw ? Number(raw) : null };
    }
    case "MULTIPLE_TEAMS": {
      const clubIds = formData
        .getAll("clubIds")
        .filter((v): v is string => typeof v === "string" && v.length > 0);
      return { ...base, multiClubIds: clubIds };
    }
    default:
      return { ...base, textValue: formField(formData, "textValue") ?? null };
  }
}

export async function submitGroundTruthResult(
  seasonQuestionId: string,
  formData: FormData,
) {
  const admin = await requireAdmin();

  const seasonQuestion = await prisma.seasonQuestion.findUniqueOrThrow({
    where: { id: seasonQuestionId },
    include: {
      questionDefinition: true,
      answers: { include: { multiClubs: true } },
    },
  });
  await requireResultsEditable(seasonQuestion.seasonId);

  const { answerType, scoringStrategy } = seasonQuestion.questionDefinition;
  if (
    scoringStrategy !== "EXACT_MATCH" &&
    scoringStrategy !== "POSITION_DIFFERENCE" &&
    scoringStrategy !== "MULTI_SELECT"
  ) {
    throw new Error(
      "This question isn't scored from a single ground-truth answer.",
    );
  }

  const groundTruth = extractGroundTruth(formData, answerType);

  await prisma.$transaction(async (tx) => {
    const resultData = {
      clubId: groundTruth.clubId,
      managerId: groundTruth.managerId,
      numberValue: groundTruth.numberValue,
      textValue: groundTruth.textValue,
      finalizedByUserId: admin.id,
      finalizedAt: new Date(),
    };

    const result = await tx.seasonQuestionResult.upsert({
      where: { seasonQuestionId },
      update: resultData,
      create: { seasonQuestionId, ...resultData },
    });

    await tx.seasonQuestionResultClub.deleteMany({
      where: { seasonQuestionResultId: result.id },
    });
    if (groundTruth.multiClubIds.length > 0) {
      await tx.seasonQuestionResultClub.createMany({
        data: groundTruth.multiClubIds.map((clubId) => ({
          seasonQuestionResultId: result.id,
          clubId,
        })),
      });
    }

    const actual: ComparableAnswer = {
      clubId: groundTruth.clubId,
      managerId: groundTruth.managerId,
      numberValue: groundTruth.numberValue,
      textValue: groundTruth.textValue,
      multiClubs: groundTruth.multiClubIds.map((clubId) => ({ clubId })),
    };

    for (const answer of seasonQuestion.answers) {
      const predicted: ComparableAnswer = {
        clubId: answer.clubId,
        managerId: answer.managerId,
        numberValue: answer.numberValue,
        textValue: answer.textValue,
        multiClubs: answer.multiClubs,
      };

      const points = computeObjectiveScore(
        scoringStrategy,
        answerType,
        seasonQuestion.points,
        predicted,
        actual,
      );

      await tx.scoringResult.upsert({
        where: { predictionAnswerId: answer.id },
        update: { points, computedAt: new Date() },
        create: { predictionAnswerId: answer.id, points },
      });
    }

    await tx.seasonQuestion.update({
      where: { id: seasonQuestionId },
      data: { resultFinalizedAt: new Date() },
    });
  });

  await maybeCompleteSeason(seasonQuestion.seasonId);
  revalidatePath(`/admin/seasons/${seasonQuestion.seasonId}/results`);
}

export async function gradeManualReviewAnswer(
  predictionAnswerId: string,
  isCorrect: boolean,
) {
  await requireAdmin();

  const answer = await prisma.predictionAnswer.findUniqueOrThrow({
    where: { id: predictionAnswerId },
    include: { seasonQuestion: { include: { questionDefinition: true } } },
  });

  if (
    answer.seasonQuestion.questionDefinition.scoringStrategy !== "MANUAL_REVIEW"
  ) {
    throw new Error("This question isn't manually graded.");
  }
  await requireResultsEditable(answer.seasonQuestion.seasonId);

  const points = isCorrect ? answer.seasonQuestion.points : 0;

  await prisma.scoringResult.upsert({
    where: { predictionAnswerId },
    update: { points, computedAt: new Date() },
    create: { predictionAnswerId, points },
  });

  revalidatePath(`/admin/seasons/${answer.seasonQuestion.seasonId}/results`);
}

export async function finalizeManualReviewQuestion(seasonQuestionId: string) {
  await requireAdmin();

  const seasonQuestion = await prisma.seasonQuestion.findUniqueOrThrow({
    where: { id: seasonQuestionId },
    include: {
      questionDefinition: true,
      answers: { include: { scoringResult: true } },
    },
  });

  if (seasonQuestion.questionDefinition.scoringStrategy !== "MANUAL_REVIEW") {
    throw new Error("This question isn't manually graded.");
  }
  await requireResultsEditable(seasonQuestion.seasonId);

  const ungraded = seasonQuestion.answers.filter((a) => !a.scoringResult);
  if (ungraded.length > 0) {
    throw new Error(`${ungraded.length} answer(s) still need grading.`);
  }

  await prisma.seasonQuestion.update({
    where: { id: seasonQuestionId },
    data: { resultFinalizedAt: new Date() },
  });

  await maybeCompleteSeason(seasonQuestion.seasonId);
  revalidatePath(`/admin/seasons/${seasonQuestion.seasonId}/results`);
}
