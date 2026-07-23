import { z } from "zod";

export const quoteInput = z.object({
  imageUrl: z.string().trim().url("Must be a valid URL"),
  text: z.string().trim().max(300).optional(),
  authorName: z.string().trim().max(60).optional(),
});

export type QuoteInput = z.infer<typeof quoteInput>;
