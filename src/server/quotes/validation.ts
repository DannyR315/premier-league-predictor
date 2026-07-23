import { z } from "zod";

export const quoteInput = z.object({
  text: z.string().trim().min(1, "Quote text is required").max(300),
  authorName: z.string().trim().min(1, "Author is required").max(60),
  imageUrl: z.string().trim().url("Must be a valid URL").optional(),
});

export type QuoteInput = z.infer<typeof quoteInput>;
