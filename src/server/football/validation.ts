import { z } from "zod";

export const clubInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  shortName: z.string().trim().max(20).optional(),
  crestUrl: z.string().trim().url("Must be a valid URL").optional(),
});

export type ClubInput = z.infer<typeof clubInput>;

export const managerInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  nationality: z.string().trim().max(60).optional(),
  currentClubId: z.string().optional(),
});

export type ManagerInput = z.infer<typeof managerInput>;
