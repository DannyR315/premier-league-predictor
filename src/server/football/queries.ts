import "server-only";
import { prisma } from "@/lib/prisma";

export function getClubs() {
  return prisma.club.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          predictionAnswers: true,
          predictionAnswerMulti: true,
          seasonResults: true,
          seasonResultMulti: true,
        },
      },
    },
  });
}

export function getManagers() {
  return prisma.manager.findMany({
    include: {
      currentClub: true,
      _count: { select: { predictionAnswers: true, seasonResults: true } },
    },
    orderBy: { name: "asc" },
  });
}
