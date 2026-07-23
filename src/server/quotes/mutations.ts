"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { formField as field } from "@/lib/form-data";
import { quoteInput } from "./validation";

export async function createQuote(formData: FormData) {
  await requireAdmin();

  const data = quoteInput.parse({
    imageUrl: field(formData, "imageUrl"),
    text: field(formData, "text"),
    authorName: field(formData, "authorName"),
  });

  await prisma.quote.create({
    data: {
      imageUrl: data.imageUrl,
      text: data.text ?? null,
      authorName: data.authorName ?? null,
    },
  });
  revalidatePath("/admin/quotes");
}

export async function deleteQuote(quoteId: string) {
  await requireAdmin();

  await prisma.quote.delete({ where: { id: quoteId } });
  revalidatePath("/admin/quotes");
}
