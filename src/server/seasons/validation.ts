import { z } from "zod";

export const seasonInput = z
  .object({
    label: z.string().trim().min(1, "Label is required").max(50),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    predictionsLockAt: z.coerce.date(),
  })
  .refine((data) => !data.endDate || data.endDate >= data.startDate, {
    message: "End date can't be before the start date",
    path: ["endDate"],
  });

export type SeasonInput = z.infer<typeof seasonInput>;

export const seasonQuestionInput = z.object({
  questionDefinitionId: z.string().min(1, "Pick a question"),
  points: z.coerce.number().int().positive("Points must be positive"),
});

export type SeasonQuestionInput = z.infer<typeof seasonQuestionInput>;
