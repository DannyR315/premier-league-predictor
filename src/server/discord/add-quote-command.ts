import "server-only";
import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { renderQuoteCard } from "./render-quote-card";

type AddQuoteResult = { ok: true } | { ok: false; message: string };

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function requireDiscordAdmin(discordUserId: string) {
  const user = await prisma.user.findUnique({
    where: { discordId: discordUserId },
  });
  if (!user || user.role !== "ADMIN" || user.status !== "ACTIVE") {
    return null;
  }
  return user;
}

async function saveQuoteImage(
  bytes: ArrayBuffer,
  contentType: string,
): Promise<AddQuoteResult> {
  const extension = EXTENSION_BY_CONTENT_TYPE[contentType] ?? "png";

  const blob = await put(`quotes/${Date.now()}.${extension}`, bytes, {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });

  await prisma.quote.create({ data: { imageUrl: blob.url } });
  revalidatePath("/admin/quotes");

  return { ok: true };
}

/**
 * Backs the "Add as quote" message command for messages with an image
 * attachment/embed. Re-hosts the image on our own Blob storage rather than
 * saving Discord's CDN URL directly — Discord attachment URLs aren't
 * guaranteed to stay valid indefinitely.
 */
export async function addQuoteFromImageUrl(
  discordUserId: string,
  imageUrl: string,
): Promise<AddQuoteResult> {
  const admin = await requireDiscordAdmin(discordUserId);
  if (!admin) return { ok: false, message: "Only admins can add quotes." };

  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) {
    return { ok: false, message: "Couldn't download that image." };
  }

  const contentType = imageRes.headers.get("content-type") ?? "image/png";
  const bytes = await imageRes.arrayBuffer();

  return saveQuoteImage(bytes, contentType);
}

/**
 * Backs the "Add as quote" message command for text-only messages — the
 * best quotes often aren't screenshots. Renders the message as a Discord-
 * style card (avatar, username, text) so it still fits into the same
 * all-images wall.
 */
export async function addQuoteFromText(
  discordUserId: string,
  quote: { text: string; authorName: string; authorAvatarUrl?: string },
): Promise<AddQuoteResult> {
  const admin = await requireDiscordAdmin(discordUserId);
  if (!admin) return { ok: false, message: "Only admins can add quotes." };

  const bytes = await renderQuoteCard(quote);
  return saveQuoteImage(bytes, "image/png");
}
