import "server-only";
import { prisma } from "@/lib/prisma";

export function getSeasonForResults(seasonId: string) {
  return prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      competition: true,
      seasonQuestions: {
        where: { active: true },
        include: {
          questionDefinition: true,
          result: {
            include: {
              club: true,
              manager: true,
              multiClubs: { include: { club: true } },
            },
          },
          answers: {
            include: {
              prediction: { include: { user: true } },
              club: true,
              manager: true,
              multiClubs: { include: { club: true } },
              scoringResult: true,
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
}

export type SeasonForResults = NonNullable<
  Awaited<ReturnType<typeof getSeasonForResults>>
>;

export function getSeasonLeaderboard(seasonId: string) {
  return prisma.prediction.findMany({
    where: { seasonId },
    include: {
      user: true,
      answers: {
        include: {
          scoringResult: true,
          seasonQuestion: { include: { questionDefinition: true } },
        },
      },
    },
  });
}
