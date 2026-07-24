import { z } from "zod";

export const quoteInput = z.object({
  imageUrl: z.string().trim().url("Must be a valid URL"),
});

export type QuoteInput = z.infer<typeof quoteInput>;
