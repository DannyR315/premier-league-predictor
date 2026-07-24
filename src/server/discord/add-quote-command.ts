import "server-only";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type AddQuoteResult = { ok: true } | { ok: false; message: string };

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Backs the "Add as quote" message command. Re-hosts the image on our own
 * Blob storage rather than saving Discord's CDN URL directly — Discord
 * attachment URLs aren't guaranteed to stay valid indefinitely.
 */
export async function addQuoteFromMessage(
  discordUserId: string,
  imageUrl: string,
): Promise<AddQuoteResult> {
  const user = await prisma.user.findUnique({
    where: { discordId: discordUserId },
  });
  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    return { ok: false, message: "Only admins can add quotes." };
  }

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    return { ok: false, message: "Couldn't download that image." };
  }

  const contentType = imageRes.headers.get("content-type") ?? "image/png";
  const extension = EXTENSION_BY_CONTENT_TYPE[contentType] ?? "png";
  const bytes = await imageRes.arrayBuffer();

  const blob = await put(`quotes/${Date.now()}.${extension}`, bytes, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });

  await prisma.quote.create({ data: { imageUrl: blob.url } });
  revalidatePath("/admin/quotes");

  return { ok: true };
}
