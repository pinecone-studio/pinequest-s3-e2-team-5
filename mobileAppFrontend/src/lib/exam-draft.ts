import * as SecureStore from "expo-secure-store";
import type { StudentAnswerDraft } from "@/lib/student-types";

type StoredExamDraft = {
  startedAt: number;
  answers: Record<string, StudentAnswerDraft>;
  currentQuestionIndex?: number;
};

function getDraftKey(examId: string) {
  const normalizedExamId = examId.replace(/[^A-Za-z0-9._-]/g, "_") || "default";
  return `pinequest-exam-draft_${normalizedExamId}`;
}

export async function getExamDraft(examId: string): Promise<StoredExamDraft | null> {
  const raw = await SecureStore.getItemAsync(getDraftKey(examId));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredExamDraft;

    if (typeof parsed.startedAt !== "number" || Number.isNaN(parsed.startedAt)) {
      return null;
    }

    return {
      startedAt: parsed.startedAt,
      answers: parsed.answers ?? {},
      currentQuestionIndex:
        typeof parsed.currentQuestionIndex === "number" ? parsed.currentQuestionIndex : 0,
    };
  } catch {
    return null;
  }
}

export async function saveExamDraft(examId: string, draft: StoredExamDraft) {
  await SecureStore.setItemAsync(getDraftKey(examId), JSON.stringify(draft));
}

export async function clearExamDraft(examId: string) {
  await SecureStore.deleteItemAsync(getDraftKey(examId));
}
