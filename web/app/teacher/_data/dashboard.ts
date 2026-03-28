export type SubjectKey =
  | "all"
  | "social"
  | "civics"
  | "math"
  | "english"
  | "chemistry"
  | "physics";

export type ExamCard = {
  id: string;
  title: string;
  topic: string;
  grade: string;
  date: string;
  startTime: string;
  duration: number;
  taskCount: number;
  subject: Exclude<SubjectKey, "all">;
  classroomName?: string | null;
};

export type StudentResult = {
  id: string;
  studentId: string;
  name: string;
  section: string;
  score: string;
  submittedAt: number;
  durationMinutes: number;
  percent: number;
};

export type SubjectCardPalette = {
  cardBackground: string;
  borderColor: string;
  iconBackground: string;
  actionButtonBackground: string;
  actionButtonInsetShadow: string;
  actionButtonDropShadow: string;
};

export const subjectTabs: { key: SubjectKey; label: string }[] = [
  { key: "all", label: "Бүгд" },
  { key: "social", label: "Нийгэм" },
  { key: "civics", label: "Иргэний боловсрол" },
  { key: "math", label: "Математик" },
  { key: "english", label: "Англи хэл" },
  { key: "chemistry", label: "Хими" },
  { key: "physics", label: "Физик" },
];

const purplePalette: SubjectCardPalette = {
  cardBackground: "#DCD9FF99",
  borderColor: "#C8C2FF99",
  iconBackground: "#CDC7FF99",
  actionButtonBackground: "#9E81F0",
  actionButtonInsetShadow: "rgba(103, 79, 184, 0.38)",
  actionButtonDropShadow: "rgba(158, 129, 240, 0.22)",
};

const bluePalette: SubjectCardPalette = {
  cardBackground: "#D4EBFF99",
  borderColor: "#B9DEFF99",
  iconBackground: "#BFE0FF99",
  actionButtonBackground: "#6C95EA",
  actionButtonInsetShadow: "rgba(66, 105, 185, 0.38)",
  actionButtonDropShadow: "rgba(108, 149, 234, 0.24)",
};

const pinkPalette: SubjectCardPalette = {
  cardBackground: "#F8DBFD99",
  borderColor: "#F1C2FB99",
  iconBackground: "#F2C8FA99",
  actionButtonBackground: "#D98AEF",
  actionButtonInsetShadow: "rgba(170, 93, 191, 0.38)",
  actionButtonDropShadow: "rgba(217, 138, 239, 0.24)",
};

const cyanPalette: SubjectCardPalette = {
  cardBackground: "#E0F1F699",
  borderColor: "#C6E5EE99",
  iconBackground: "#CFEAF299",
  actionButtonBackground: "#69B7D5",
  actionButtonInsetShadow: "rgba(66, 126, 149, 0.34)",
  actionButtonDropShadow: "rgba(105, 183, 213, 0.22)",
};

const subjectCardPaletteSequence: Record<
  Exclude<SubjectKey, "all">,
  SubjectCardPalette
> = {
  social: purplePalette,
  civics: bluePalette,
  math: cyanPalette,
  english: bluePalette,
  chemistry: pinkPalette,
  physics: cyanPalette,
};

export function getSubjectCardPalette(subject: string): SubjectCardPalette {
  return (
    subjectCardPaletteSequence[
      (subject as Exclude<SubjectKey, "all">) || "social"
    ] ?? subjectCardPaletteSequence.social
  );
}

export function getSubjectDisplayLabel(subject: string) {
  if (subject === "civics") {
    return "Иргэний боловсрол";
  }

  if (subject === "math") {
    return "Математик";
  }

  if (subject === "english") {
    return "Англи хэл";
  }

  if (subject === "chemistry") {
    return "Хими";
  }

  if (subject === "physics") {
    return "Физик";
  }

  return "Нийгэм";
}
