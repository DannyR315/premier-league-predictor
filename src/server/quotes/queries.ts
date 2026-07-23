import "server-only";
import { prisma } from "@/lib/prisma";

export function getQuotes() {
  return prisma.quote.findMany({ orderBy: { createdAt: "desc" } });
}
