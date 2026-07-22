"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { formField as field } from "@/lib/form-data";
import { clubInput, managerInput } from "./validation";

export async function createClub(formData: FormData) {
  await requireAdmin();

  const data = clubInput.parse({
    name: field(formData, "name"),
    shortName: field(formData, "shortName"),
    crestUrl: field(formData, "crestUrl"),
  });

  await prisma.club.create({ data });
  revalidatePath("/admin/football/clubs");
}

export async function updateClub(clubId: string, formData: FormData) {
  await requireAdmin();

  const data = clubInput.parse({
    name: field(formData, "name"),
    shortName: field(formData, "shortName"),
    crestUrl: field(formData, "crestUrl"),
  });

  await prisma.club.update({
    where: { id: clubId },
    data: {
      name: data.name,
      shortName: data.shortName ?? null,
      crestUrl: data.crestUrl ?? null,
    },
  });
  revalidatePath("/admin/football/clubs");
}

export async function deleteClub(clubId: string) {
  await requireAdmin();

  const [predictionAnswers, predictionAnswerMulti, seasonResults, seasonResultMulti] =
    await Promise.all([
      prisma.predictionAnswer.count({ where: { clubId } }),
      prisma.predictionAnswerClub.count({ where: { clubId } }),
      prisma.seasonQuestionResult.count({ where: { clubId } }),
      prisma.seasonQuestionResultClub.count({ where: { clubId } }),
    ]);

  if (
    predictionAnswers + predictionAnswerMulti + seasonResults + seasonResultMulti >
    0
  ) {
    throw new Error(
      "Can't delete a club that's referenced by a prediction or result.",
    );
  }

  await prisma.club.delete({ where: { id: clubId } });
  revalidatePath("/admin/football/clubs");
}

export async function createManager(formData: FormData) {
  await requireAdmin();

  const data = managerInput.parse({
    name: field(formData, "name"),
    nationality: field(formData, "nationality"),
    currentClubId: field(formData, "currentClubId"),
  });

  await prisma.manager.create({ data });
  revalidatePath("/admin/football/managers");
}

export async function updateManager(managerId: string, formData: FormData) {
  await requireAdmin();

  const data = managerInput.parse({
    name: field(formData, "name"),
    nationality: field(formData, "nationality"),
    currentClubId: field(formData, "currentClubId"),
  });

  await prisma.manager.update({
    where: { id: managerId },
    data: {
      name: data.name,
      nationality: data.nationality ?? null,
      currentClubId: data.currentClubId ?? null,
    },
  });
  revalidatePath("/admin/football/managers");
}

export async function deleteManager(managerId: string) {
  await requireAdmin();

  const [predictionAnswers, seasonResults] = await Promise.all([
    prisma.predictionAnswer.count({ where: { managerId } }),
    prisma.seasonQuestionResult.count({ where: { managerId } }),
  ]);

  if (predictionAnswers + seasonResults > 0) {
    throw new Error(
      "Can't delete a manager who's referenced by a prediction or result.",
    );
  }

  await prisma.manager.delete({ where: { id: managerId } });
  revalidatePath("/admin/football/managers");
}
