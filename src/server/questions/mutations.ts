"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/server/auth/require-admin";
import { formField as field } from "@/lib/form-data";
import { questionDefinitionInput } from "./validation";

export async function createQuestionDefinition(formData: FormData) {
  await requireAdmin();

  const data = questionDefinitionInput.parse({
    text: field(formData, "text"),
    description: field(formData, "description"),
    answerType: field(formData, "answerType"),
    scoringStrategy: field(formData, "scoringStrategy"),
    selectionCount: field(formData, "selectionCount"),
  });

  await prisma.questionDefinition.create({ data });
  revalidatePath("/admin/questions");
}

export async function updateQuestionDefinition(
  questionId: string,
  formData: FormData,
) {
  await requireAdmin();

  const data = questionDefinitionInput.parse({
    text: field(formData, "text"),
    description: field(formData, "description"),
    answerType: field(formData, "answerType"),
    scoringStrategy: field(formData, "scoringStrategy"),
    selectionCount: field(formData, "selectionCount"),
  });

  const existing = await prisma.questionDefinition.findUniqueOrThrow({
    where: { id: questionId },
    include: { _count: { select: { seasonQuestions: true } } },
  });

  // Text/description are just labels, safe to fix anytime. answerType/
  // scoringStrategy/selectionCount define the shape of every PredictionAnswer
  // already collected against this question (in this or any other season
  // reusing it) — changing them once in use would silently corrupt how those
  // existing answers render and score.
  if (existing._count.seasonQuestions > 0) {
    const structuralChange =
      data.answerType !== existing.answerType ||
      data.scoringStrategy !== existing.scoringStrategy ||
      (data.selectionCount ?? null) !== existing.selectionCount;
    if (structuralChange) {
      throw new Error(
        "Can't change the answer type, scoring strategy, or selection count of a question that's already used in a season.",
      );
    }
  }

  await prisma.questionDefinition.update({
    where: { id: questionId },
    data: {
      text: data.text,
      description: data.description ?? null,
      answerType: data.answerType,
      scoringStrategy: data.scoringStrategy,
      selectionCount: data.selectionCount ?? null,
    },
  });
  revalidatePath("/admin/questions");
}

export async function deleteQuestionDefinition(questionId: string) {
  await requireAdmin();

  const usageCount = await prisma.seasonQuestion.count({
    where: { questionDefinitionId: questionId },
  });

  if (usageCount > 0) {
    // Defense in depth — the UI already hides/disables delete once a question
    // is in use, since removing it would break historical seasons that
    // reference it via SeasonQuestion.
    throw new Error(
      "Can't delete a question that's already used in a season.",
    );
  }

  await prisma.questionDefinition.delete({ where: { id: questionId } });
  revalidatePath("/admin/questions");
}
