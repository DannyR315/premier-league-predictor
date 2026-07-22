"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { AnswerType } from "@prisma/client";
import { requireActiveUser } from "@/server/auth/require-active-user";
import { getEffectiveStatus } from "@/server/seasons/lifecycle";
import { formField } from "@/lib/form-data";
import { predictionFieldName } from "./field-names";
import { notifyDiscord } from "@/server/discord/notify";

type ExtractedAnswer =
  | {
      kind: "single";
      clubId?: string;
      managerId?: string;
      numberValue?: number;
      textValue?: string;
    }
  | { kind: "multi"; clubIds: string[] };

function extractAnswer(
  formData: FormData,
  answerType: AnswerType,
  key: string,
): ExtractedAnswer | null {
  if (answerType === "MULTIPLE_TEAMS") {
    const clubIds = formData
      .getAll(key)
      .filter((v): v is string => typeof v === "string" && v.length > 0);
    return clubIds.length > 0 ? { kind: "multi", clubIds } : null;
  }

  const raw = formField(formData, key);
  if (!raw) return null;

  switch (answerType) {
    case "TEAM":
      return { kind: "single", clubId: raw };
    case "MANAGER":
      return { kind: "single", managerId: raw };
    case "NUMBER":
    case "LEAGUE_POSITION": {
      const numberValue = Number(raw);
      return Number.isNaN(numberValue) ? null : { kind: "single", numberValue };
    }
    case "PLAYER":
    case "TEXT":
      return { kind: "single", textValue: raw };
    default:
      return null;
  }
}

export async function submitPrediction(seasonId: string, formData: FormData) {
  const user = await requireActiveUser();

  const season = await prisma.season.findUniqueOrThrow({
    where: { id: seasonId },
  });

  if (getEffectiveStatus(season) !== "OPEN") {
    throw new Error("Predictions aren't open for this season.");
  }

  const seasonQuestions = await prisma.seasonQuestion.findMany({
    where: { seasonId, active: true },
    include: { questionDefinition: true },
  });

  const errors: string[] = [];
  const toWrite: { seasonQuestionId: string; answer: ExtractedAnswer | null }[] =
    [];

  for (const sq of seasonQuestions) {
    const answer = extractAnswer(
      formData,
      sq.questionDefinition.answerType,
      predictionFieldName(sq.id),
    );

    if (!answer) {
      if (sq.required) {
        errors.push(`"${sq.questionDefinition.text}" is required.`);
      }
      toWrite.push({ seasonQuestionId: sq.id, answer: null });
      continue;
    }

    if (answer.kind === "multi") {
      const expected = sq.questionDefinition.selectionCount ?? 0;
      if (answer.clubIds.length !== expected) {
        errors.push(
          `"${sq.questionDefinition.text}" needs exactly ${expected} pick${expected === 1 ? "" : "s"}.`,
        );
        continue;
      }
      if (new Set(answer.clubIds).size !== answer.clubIds.length) {
        errors.push(`"${sq.questionDefinition.text}" can't pick the same team twice.`);
        continue;
      }
    }

    toWrite.push({ seasonQuestionId: sq.id, answer });
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" "));
  }

  let isFirstSubmission = false;

  await prisma.$transaction(async (tx) => {
    const prediction = await tx.prediction.upsert({
      where: { seasonId_userId: { seasonId, userId: user.id } },
      update: {},
      create: { seasonId, userId: user.id },
    });
    // submittedAt is only set on create; updatedAt is stamped on every write
    // (including this same create). Reading them off the upsert result — as
    // opposed to a separate pre-check query — avoids a race where two
    // concurrent submits could both see "doesn't exist yet" and both fire
    // the Discord notification below.
    isFirstSubmission =
      prediction.submittedAt.getTime() === prediction.updatedAt.getTime();

    for (const { seasonQuestionId, answer } of toWrite) {
      if (!answer) {
        // Optional question left blank — clear any previously saved answer.
        await tx.predictionAnswer.deleteMany({
          where: { predictionId: prediction.id, seasonQuestionId },
        });
        continue;
      }

      const data =
        answer.kind === "single"
          ? {
              clubId: answer.clubId ?? null,
              managerId: answer.managerId ?? null,
              numberValue: answer.numberValue ?? null,
              textValue: answer.textValue ?? null,
            }
          : {
              clubId: null,
              managerId: null,
              numberValue: null,
              textValue: null,
            };

      const predictionAnswer = await tx.predictionAnswer.upsert({
        where: {
          predictionId_seasonQuestionId: {
            predictionId: prediction.id,
            seasonQuestionId,
          },
        },
        update: data,
        create: { predictionId: prediction.id, seasonQuestionId, ...data },
      });

      if (answer.kind === "multi") {
        await tx.predictionAnswerClub.deleteMany({
          where: { predictionAnswerId: predictionAnswer.id },
        });
        await tx.predictionAnswerClub.createMany({
          data: answer.clubIds.map((clubId) => ({
            predictionAnswerId: predictionAnswer.id,
            clubId,
          })),
        });
      }
    }
  });

  if (isFirstSubmission) {
    await notifyDiscord(
      `🔮 **${user.username}** just submitted their predictions for ${season.label}!`,
    );
  }

  revalidatePath(`/seasons/${seasonId}/predict`);
  redirect(`/seasons/${seasonId}/predict?saved=1`);
}
