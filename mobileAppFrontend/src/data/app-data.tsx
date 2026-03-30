import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { examCatalog, seedSubmissions, studentProfile } from "@/data/student-data";
import type { Exam, StudentProfile, Submission } from "@/data/types";

type AppDataContextValue = {
  student: StudentProfile;
  availableExams: Exam[];
  submissions: Submission[];
  getExamById: (examId: string) => Exam | null;
  getSubmissionById: (submissionId: string) => Submission | null;
  submitExam: (input: {
    examId: string;
    startedAt: number;
    answers: { questionId: string; selectedChoiceId: string | null; answerText: string | null }[];
  }) => Promise<{ id: string }>;
  resetData: () => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function buildSubmissionId(examId: string) {
  return `submission-${examId}`;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [submissions, setSubmissions] = useState<Submission[]>(() => [...seedSubmissions]);

  const submittedExamIds = useMemo(
    () => new Set(submissions.map((submission) => submission.examId)),
    [submissions],
  );

  const availableExams = useMemo(
    () => examCatalog.filter((exam) => !submittedExamIds.has(exam.id)),
    [submittedExamIds],
  );

  const getExamById = useCallback((examId: string) => {
    return examCatalog.find((exam) => exam.id === examId) ?? null;
  }, []);

  const getSubmissionById = useCallback(
    (submissionId: string) => submissions.find((submission) => submission.id === submissionId) ?? null,
    [submissions],
  );

  const submitExam = useCallback<AppDataContextValue["submitExam"]>(async ({ examId, answers }) => {
    const exam = examCatalog.find((entry) => entry.id === examId);

    if (!exam) {
      throw new Error("Шалгалтын мэдээлэл олдсонгүй.");
    }

    const reviewedAnswers = exam.questions.map((question) => {
      const draft = answers.find((answer) => answer.questionId === question.id);
      const correctChoice = question.choices.find((choice) => choice.isCorrect) ?? null;
      const isCorrect = draft?.selectedChoiceId === correctChoice?.id;

      return {
        questionId: question.id,
        order: question.order,
        question: question.question,
        type: question.type,
        answerText: null,
        selectedChoiceId: draft?.selectedChoiceId ?? null,
        correctChoiceId: correctChoice?.id ?? null,
        isCorrect,
        choices: question.choices.map((choice) => ({
          id: choice.id,
          label: choice.label,
          text: choice.text,
        })),
      };
    });

    const correctAnswers = reviewedAnswers.filter((answer) => answer.isCorrect).length;
    const nextSubmission: Submission = {
      id: buildSubmissionId(exam.id),
      examId: exam.id,
      title: exam.title,
      subject: exam.subject,
      grade: exam.grade,
      duration: exam.duration,
      questionCount: exam.questions.length,
      correctAnswers,
      scorePercent: Math.round((correctAnswers / exam.questions.length) * 100),
      submittedAt: Date.now(),
      scheduledDate: exam.scheduledDate,
      startTime: exam.startTime,
      answers: reviewedAnswers,
    };

    setSubmissions((current) => [
      nextSubmission,
      ...current.filter((submission) => submission.examId !== exam.id),
    ]);

    return { id: nextSubmission.id };
  }, []);

  const resetData = useCallback(() => {
    setSubmissions([...seedSubmissions]);
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      student: studentProfile,
      availableExams,
      submissions,
      getExamById,
      getSubmissionById,
      submitExam,
      resetData,
    }),
    [availableExams, getExamById, getSubmissionById, resetData, submitExam, submissions],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider.");
  }

  return context;
}
