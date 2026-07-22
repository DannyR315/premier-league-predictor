"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { formField as field } from "@/lib/form-data";

export async function approveUser(userId: string, formData: FormData) {
  await requireAdmin();

  const role = z.nativeEnum(Role).parse(field(formData, "role"));

  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE", role },
  });

  revalidatePath("/admin/users");
}

export async function toggleAdminRole(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    throw new Error("You can't change your own role.");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  await prisma.user.update({
    where: { id: userId },
    data: { role: user.role === "ADMIN" ? "PLAYER" : "ADMIN" },
  });

  revalidatePath("/admin/users");
}

export async function revokeUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) {
    throw new Error("You can't revoke your own access.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "REVOKED" },
  });

  revalidatePath("/admin/users");
}

export async function reactivateUser(userId: string) {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/admin/users");
}
