// Shared between the predict form (to name its inputs) and the submit Server
// Action (to read them back out of FormData). Kept out of mutations.ts
// because a "use server" file may only export async functions.
export function predictionFieldName(seasonQuestionId: string) {
  return `q-${seasonQuestionId}`;
}
