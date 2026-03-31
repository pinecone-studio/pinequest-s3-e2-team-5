const examPdfDraftStore = new Map<string, File>();

export function setExamPdfDraft(examId: string, file: File) {
  examPdfDraftStore.set(examId, file);
}

export function consumeExamPdfDraft(examId: string) {
  const draft = examPdfDraftStore.get(examId) ?? null;

  if (draft) {
    examPdfDraftStore.delete(examId);
  }

  return draft;
}
