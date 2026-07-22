import "server-only";
import type { AnswerType, ScoringStrategy } from "@prisma/client";

/**
 * PredictionAnswer and SeasonQuestionResult are deliberately shaped the same
 * way (clubId/managerId/numberValue/textValue/multiClubs) so a single
 * comparison function can score a predicted answer against the ground truth
 * without caring which table either one came from.
 */
export type ComparableAnswer = {
  clubId: string | null;
  managerId: string | null;
  numberValue: number | null;
  textValue: string | null;
  multiClubs: { clubId: string }[];
};

/**
 * Only handles the three ground-truth-driven strategies. MANUAL_REVIEW is
 * graded directly by an admin per answer, and COMMUNITY_VOTE is derived from
 * rating averages — neither compares against a single ground truth, so both
 * are computed elsewhere.
 */
export function computeObjectiveScore(
  strategy: Extract<
    ScoringStrategy,
    "EXACT_MATCH" | "POSITION_DIFFERENCE" | "MULTI_SELECT"
  >,
  answerType: AnswerType,
  points: number,
  predicted: ComparableAnswer,
  actual: ComparableAnswer,
): number {
  switch (strategy) {
    case "EXACT_MATCH":
      return scoreExactMatch(answerType, points, predicted, actual);
    case "POSITION_DIFFERENCE":
      return scorePositionDifference(points, predicted, actual);
    case "MULTI_SELECT":
      return scoreMultiSelect(points, predicted, actual);
  }
}

function scoreExactMatch(
  answerType: AnswerType,
  points: number,
  predicted: ComparableAnswer,
  actual: ComparableAnswer,
): number {
  switch (answerType) {
    case "TEAM":
      return predicted.clubId && predicted.clubId === actual.clubId ? points : 0;
    case "MANAGER":
      return predicted.managerId && predicted.managerId === actual.managerId
        ? points
        : 0;
    case "NUMBER":
    case "LEAGUE_POSITION":
      return predicted.numberValue !== null &&
        predicted.numberValue === actual.numberValue
        ? points
        : 0;
    default: {
      // PLAYER / TEXT — free text, so compare case/whitespace-insensitively
      const predictedText = predicted.textValue?.trim().toLowerCase();
      const actualText = actual.textValue?.trim().toLowerCase();
      return predictedText && actualText && predictedText === actualText
        ? points
        : 0;
    }
  }
}

/** Loses 1 point per position off, floored at 0. */
function scorePositionDifference(
  points: number,
  predicted: ComparableAnswer,
  actual: ComparableAnswer,
): number {
  if (predicted.numberValue === null || actual.numberValue === null) return 0;
  const diff = Math.abs(predicted.numberValue - actual.numberValue);
  return Math.max(0, points - diff);
}

/** Scaled by how many of the actual picks were also predicted. */
function scoreMultiSelect(
  points: number,
  predicted: ComparableAnswer,
  actual: ComparableAnswer,
): number {
  const actualIds = new Set(actual.multiClubs.map((c) => c.clubId));
  if (actualIds.size === 0) return 0;
  const correct = predicted.multiClubs.filter((c) =>
    actualIds.has(c.clubId),
  ).length;
  return Math.round((points * correct) / actualIds.size);
}
