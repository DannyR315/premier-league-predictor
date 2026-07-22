import "server-only";
import type { Season, SeasonStatus } from "@prisma/client";

/**
 * OPEN -> LOCKED is time-based (predictionsLockAt), not an admin action, and
 * is never written to the DB — it's derived here so there's no cron job
 * needed to flip it. The actual edit-lock enforcement for predictions lives
 * in the prediction Server Action itself, which must check the timestamp
 * directly rather than trust this derived value.
 */
export function getEffectiveStatus(
  season: Pick<Season, "status" | "predictionsLockAt">,
): SeasonStatus {
  if (season.status === "OPEN" && season.predictionsLockAt <= new Date()) {
    return "LOCKED";
  }
  return season.status;
}

export const seasonStatusLabels: Record<SeasonStatus, string> = {
  DRAFT: "Draft",
  OPEN: "Open",
  LOCKED: "Locked",
  ENDED: "Ended",
  COMPLETED: "Completed",
};

export const seasonStatusBadgeVariant: Record<
  SeasonStatus,
  "default" | "secondary" | "outline"
> = {
  DRAFT: "secondary",
  OPEN: "default",
  LOCKED: "outline",
  ENDED: "outline",
  COMPLETED: "secondary",
};
