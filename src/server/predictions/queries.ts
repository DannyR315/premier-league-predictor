import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Draft seasons are still being assembled by an admin and shouldn't be
 * visible to players yet.
 */
export function getVisibleSeasons() {
  return prisma.season.findMany({
    where: { status: { not: "DRAFT" } },
    include: { competition: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getSeasonForPrediction(seasonId: string) {
  return prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      competition: true,
      seasonQuestions: {
        where: { active: true },
        include: { questionDefinition: true },
        orderBy: { order: "asc" },
      },
    },
  });
}

export function getExistingPrediction(seasonId: string, userId: string) {
  return prisma.prediction.findUnique({
    where: { seasonId_userId: { seasonId, userId } },
    include: {
      answers: { include: { multiClubs: true } },
    },
  });
}

export function getRevealedPredictions(seasonId: string) {
  return prisma.prediction.findMany({
    where: { seasonId },
    include: { user: true },
    orderBy: { user: { username: "asc" } },
  });
}

export function getPredictionDetail(seasonId: string, userId: string) {
  return prisma.prediction.findUnique({
    where: { seasonId_userId: { seasonId, userId } },
    include: {
      user: true,
      season: {
        include: {
          seasonQuestions: {
            where: { active: true },
            include: { questionDefinition: true },
            orderBy: { order: "asc" },
          },
        },
      },
      answers: {
        include: {
          club: true,
          manager: true,
          multiClubs: { include: { club: true } },
          seasonQuestion: { include: { questionDefinition: true } },
          reactions: { include: { user: true } },
        },
        orderBy: { seasonQuestion: { order: "asc" } },
      },
    },
  });
}
