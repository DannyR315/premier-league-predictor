import "server-only";
import { prisma } from "@/lib/prisma";

export function getUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}

export function getPendingUserCount() {
  return prisma.user.count({ where: { status: "PENDING" } });
}
