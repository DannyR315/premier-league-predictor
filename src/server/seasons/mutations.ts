"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { formField as field, formCheckbox } from "@/lib/form-data";
import { seasonInput, seasonQuestionInput } from "./validation";
import { getEffectiveStatus } from "./lifecycle";
import { notifyDiscord } from "@/server/discord/notify";

const PREMIER_LEAGUE_SLUG = "premier-league";

async function ensurePremierLeagueCompetition() {
  return prisma.competition.upsert({
    where: { slug: PREMIER_LEAGUE_SLUG },
    update: {},
    create: { slug: PREMIER_LEAGUE_SLUG, name: "Premier League" },
  });
}

export async function createSeason(formData: FormData) {
  await requireAdmin();

  const data = seasonInput.parse({
    label: field(formData, "label"),
    startDate: field(formData, "startDate"),
    endDate: field(formData, "endDate"),
    predictionsLockAt: field(formData, "predictionsLockAt"),
  });

  const competition = await ensurePremierLeagueCompetition();

  const existing = await prisma.season.findUnique({
    where: {
      competitionId_label: { competitionId: competition.id, label: data.label },
    },
  });
  if (existing) {
    throw new Error(`A season labeled "${data.label}" already exists.`);
  }

  await prisma.season.create({
    data: {
      competitionId: competition.id,
      label: data.label,
      startDate: data.startDate,
      endDate: data.endDate,
      predictionsLockAt: data.predictionsLockAt,
    },
  });

  revalidatePath("/admin/seasons");
}

export async function updateSeasonSchedule(
  seasonId: string,
  formData: FormData,
) {
  await requireAdmin();

  const season = await prisma.season.findUniqueOrThrow({
    where: { id: seasonId },
  });

  // Effective, not raw, status: once predictionsLockAt has passed, the
  // season is already revealed to everyone even though the stored status is
  // still "OPEN". Allowing a schedule edit at that point would let an admin
  // push the deadline forward and accidentally reopen editing on
  // predictions other people have already seen.
  if (getEffectiveStatus(season) !== "DRAFT" && getEffectiveStatus(season) !== "OPEN") {
    throw new Error("Can't edit the schedule once predictions have locked.");
  }

  const data = seasonInput.parse({
    label: field(formData, "label"),
    startDate: field(formData, "startDate"),
    endDate: field(formData, "endDate"),
    predictionsLockAt: field(formData, "predictionsLockAt"),
  });

  const labelCollision = await prisma.season.findUnique({
    where: {
      competitionId_label: {
        competitionId: season.competitionId,
        label: data.label,
      },
    },
  });
  if (labelCollision && labelCollision.id !== seasonId) {
    throw new Error(`A season labeled "${data.label}" already exists.`);
  }

  await prisma.season.update({
    where: { id: seasonId },
    data: {
      label: data.label,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      predictionsLockAt: data.predictionsLockAt,
    },
  });

  revalidatePath(`/admin/seasons/${seasonId}`);
}

export async function openSeason(seasonId: string) {
  await requireAdmin();

  const season = await prisma.season.findUniqueOrThrow({
    where: { id: seasonId },
    include: { _count: { select: { seasonQuestions: true } } },
  });

  if (season.status !== "DRAFT") {
    throw new Error("Only a draft season can be opened.");
  }
  if (season._count.seasonQuestions === 0) {
    throw new Error("Add at least one question before opening the season.");
  }

  await prisma.season.update({
    where: { id: seasonId },
    data: { status: "OPEN" },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  await notifyDiscord(
    `🏆 **Predictions are now open for ${season.label}!** Submit yours: ${appUrl}/seasons/${seasonId}/predict`,
  );

  revalidatePath(`/admin/seasons/${seasonId}`);
}

/**
 * OPEN -> LOCKED is normally time-based and never written to the DB (see
 * lifecycle.ts). This gives admins a manual override — mainly for testing,
 * so you're not stuck waiting on a real deadline to exercise the rest of the
 * lifecycle — by simply moving predictionsLockAt to now, which makes
 * getEffectiveStatus report LOCKED immediately.
 */
export async function lockPredictionsNow(seasonId: string) {
  await requireAdmin();

  const season = await prisma.season.findUniqueOrThrow({
    where: { id: seasonId },
  });

  if (getEffectiveStatus(season) !== "OPEN") {
    throw new Error("Only an open season can be locked.");
  }

  await prisma.season.update({
    where: { id: seasonId },
    data: { predictionsLockAt: new Date(), lockNotifiedAt: new Date() },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  await notifyDiscord(
    `🔒 **Predictions have locked for ${season.label}!** See everyone's picks: ${appUrl}/seasons/${seasonId}/predictions`,
  );

  revalidatePath(`/admin/seasons/${seasonId}`);
}

/**
 * There's no scheduled job watching for predictionsLockAt to pass, so this
 * gets called opportunistically from the predict/predictions pages instead —
 * whichever request first notices the season is now effectively locked sends
 * the announcement. The conditional updateMany acts as a simple atomic claim
 * so concurrent requests can't both send it.
 */
export async function checkAndNotifyPredictionsLocked(seasonId: string) {
  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season || season.lockNotifiedAt) return;
  if (getEffectiveStatus(season) !== "LOCKED") return;

  const { count } = await prisma.season.updateMany({
    where: { id: seasonId, lockNotifiedAt: null },
    data: { lockNotifiedAt: new Date() },
  });
  if (count === 0) return; // another request already claimed it

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  await notifyDiscord(
    `🔒 **Predictions have locked for ${season.label}!** See everyone's picks: ${appUrl}/seasons/${seasonId}/predictions`,
  );
}

export async function endSeason(seasonId: string) {
  await requireAdmin();

  const season = await prisma.season.findUniqueOrThrow({
    where: { id: seasonId },
  });

  if (getEffectiveStatus(season) !== "LOCKED") {
    throw new Error(
      "The season can only be ended once predictions have locked.",
    );
  }

  await prisma.season.update({
    where: { id: seasonId },
    data: { status: "ENDED", endedAt: new Date() },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  await notifyDiscord(
    `🏁 **${season.label} has ended!** Thanks for predicting — browse everyone's picks: ${appUrl}/seasons/${seasonId}/predictions`,
  );

  revalidatePath(`/admin/seasons/${seasonId}`);
}

export async function deleteSeason(seasonId: string) {
  await requireAdmin();

  // Deletable regardless of status (Draft, Open, Ended, ...) as long as no
  // one has actually submitted a prediction — "keep historical seasons
  // permanently" only matters once there's real data to keep. This also
  // covers cleaning up an Open/Ended season that was only ever used for
  // testing and never had a real participant.
  const predictionCount = await prisma.prediction.count({
    where: { seasonId },
  });

  if (predictionCount > 0) {
    throw new Error(
      "Can't delete a season that already has submitted predictions.",
    );
  }

  await prisma.season.delete({ where: { id: seasonId } });
  revalidatePath("/admin/seasons");
}

async function requireDraftSeason(seasonId: string) {
  const season = await prisma.season.findUniqueOrThrow({
    where: { id: seasonId },
  });
  if (season.status !== "DRAFT") {
    throw new Error(
      "The question set can only be changed while the season is a draft.",
    );
  }
  return season;
}

export async function addSeasonQuestion(seasonId: string, formData: FormData) {
  await requireAdmin();
  await requireDraftSeason(seasonId);

  const data = seasonQuestionInput.parse({
    questionDefinitionId: field(formData, "questionDefinitionId"),
    points: field(formData, "points"),
  });

  const highestOrder = await prisma.seasonQuestion.aggregate({
    where: { seasonId },
    _max: { order: true },
  });

  await prisma.seasonQuestion.create({
    data: {
      seasonId,
      questionDefinitionId: data.questionDefinitionId,
      points: data.points,
      order: (highestOrder._max.order ?? 0) + 1,
      required: formCheckbox(formData, "required"),
      active: formCheckbox(formData, "active"),
    },
  });

  revalidatePath(`/admin/seasons/${seasonId}`);
}

export async function updateSeasonQuestion(
  seasonQuestionId: string,
  formData: FormData,
) {
  await requireAdmin();

  const seasonQuestion = await prisma.seasonQuestion.findUniqueOrThrow({
    where: { id: seasonQuestionId },
  });
  await requireDraftSeason(seasonQuestion.seasonId);

  const points = field(formData, "points");
  const order = field(formData, "order");

  await prisma.seasonQuestion.update({
    where: { id: seasonQuestionId },
    data: {
      points: points ? Number(points) : seasonQuestion.points,
      order: order ? Number(order) : seasonQuestion.order,
      required: formCheckbox(formData, "required"),
      active: formCheckbox(formData, "active"),
    },
  });

  revalidatePath(`/admin/seasons/${seasonQuestion.seasonId}`);
}

export async function removeSeasonQuestion(seasonQuestionId: string) {
  await requireAdmin();

  const seasonQuestion = await prisma.seasonQuestion.findUniqueOrThrow({
    where: { id: seasonQuestionId },
  });
  await requireDraftSeason(seasonQuestion.seasonId);

  await prisma.seasonQuestion.delete({ where: { id: seasonQuestionId } });

  revalidatePath(`/admin/seasons/${seasonQuestion.seasonId}`);
}
