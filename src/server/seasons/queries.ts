import "server-only";
import { prisma } from "@/lib/prisma";

export function getSeasons() {
  return prisma.season.findMany({
    include: { competition: true, _count: { select: { seasonQuestions: true, predictions: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export function getSeason(seasonId: string) {
  return prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      competition: true,
      seasonQuestions: {
        include: { questionDefinition: true },
        orderBy: { order: "asc" },
      },
      _count: { select: { predictions: true } },
    },
  });
}

export type SeasonWithQuestions = NonNullable<
  Awaited<ReturnType<typeof getSeason>>
>;

export async function getAvailableQuestionDefinitions(seasonId: string) {
  return prisma.questionDefinition.findMany({
    where: { seasonQuestions: { none: { seasonId } } },
    orderBy: { createdAt: "asc" },
  });
}
