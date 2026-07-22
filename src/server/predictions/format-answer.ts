import "server-only";

type FormattableAnswer = {
  club: { name: string } | null;
  manager: { name: string } | null;
  multiClubs: { club: { name: string } }[];
  numberValue: number | null;
  textValue: string | null;
} | null;

export function formatAnswerValue(
  answer: FormattableAnswer,
  answerType: string,
): string {
  if (!answer) return "No answer";

  switch (answerType) {
    case "TEAM":
      return answer.club?.name ?? "No answer";
    case "MANAGER":
      return answer.manager?.name ?? "No answer";
    case "MULTIPLE_TEAMS":
      return answer.multiClubs.length > 0
        ? answer.multiClubs.map((mc) => mc.club.name).join(", ")
        : "No answer";
    case "NUMBER":
    case "LEAGUE_POSITION":
      return answer.numberValue !== null ? String(answer.numberValue) : "No answer";
    default:
      return answer.textValue ?? "No answer";
  }
}
