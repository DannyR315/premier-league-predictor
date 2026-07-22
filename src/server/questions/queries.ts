import "server-only";
import { prisma } from "@/lib/prisma";

export function getQuestionDefinitions() {
  return prisma.questionDefinition.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { seasonQuestions: true } } },
  });
}
