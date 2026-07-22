import { z } from "zod";
import { AnswerType, ScoringStrategy } from "@prisma/client";

export const questionDefinitionInput = z
  .object({
    text: z.string().trim().min(1, "Question text is required").max(300),
    description: z.string().trim().max(500).optional(),
    answerType: z.nativeEnum(AnswerType),
    scoringStrategy: z.nativeEnum(ScoringStrategy),
    selectionCount: z.coerce.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.answerType === "MULTIPLE_TEAMS" && !data.selectionCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selection count is required for Multiple Teams questions",
        path: ["selectionCount"],
      });
    }
  });

export type QuestionDefinitionInput = z.infer<typeof questionDefinitionInput>;

export const answerTypeLabels: Record<AnswerType, string> = {
  TEAM: "Team",
  PLAYER: "Player (free text)",
  MANAGER: "Manager",
  LEAGUE_POSITION: "League Position",
  MULTIPLE_TEAMS: "Multiple Teams",
  NUMBER: "Number",
  TEXT: "Text",
};

export const scoringStrategyLabels: Record<ScoringStrategy, string> = {
  EXACT_MATCH: "Exact Match",
  POSITION_DIFFERENCE: "Position Difference",
  MULTI_SELECT: "Multi Select",
  COMMUNITY_VOTE: "Community Vote",
  MANUAL_REVIEW: "Manual Review",
};

// Shorter labels for tag/badge display, where the full descriptive labels
// above (used in dropdowns) would feel wordy.
export const scoringStrategyTagLabels: Record<ScoringStrategy, string> = {
  EXACT_MATCH: "Exact",
  POSITION_DIFFERENCE: "Position Diff",
  MULTI_SELECT: "Multi Select",
  COMMUNITY_VOTE: "Community Vote",
  MANUAL_REVIEW: "Manual Review",
};

export const answerTypeTagLabels: Record<AnswerType, string> = {
  TEAM: "Team",
  PLAYER: "Player",
  MANAGER: "Manager",
  LEAGUE_POSITION: "League Pos",
  MULTIPLE_TEAMS: "Multi Team",
  NUMBER: "Number",
  TEXT: "Text",
};
