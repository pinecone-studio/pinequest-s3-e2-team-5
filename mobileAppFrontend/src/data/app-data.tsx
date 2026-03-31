import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ConfigErrorScreen } from "@/components/ConfigErrorScreen";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { examCatalog, seedSubmissions, studentProfile } from "@/data/student-data";
import type { Exam, StudentProfile, Submission } from "@/data/types";
import {
  fetchRemoteAvailableExamIds,
  fetchRemoteExamById,
  fetchRemoteStudentProfile,
  fetchRemoteSubmissionById,
  fetchRemoteSubmissionIds,
  getMobileRemoteConfig,
  submitRemoteStudentExam,
} from "@/lib/mobile-graphql";

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
  const remoteConfig = getMobileRemoteConfig();
  const useRemoteData = Boolean(remoteConfig);
  const [student, setStudent] = useState<StudentProfile>(studentProfile);
  const [submissions, setSubmissions] = useState<Submission[]>(() => [...seedSubmissions]);
  const [remoteAvailableExams, setRemoteAvailableExams] = useState<Exam[]>([]);
  const [bootStatus, setBootStatus] = useState<"loading" | "ready" | "error">(
    useRemoteData ? "loading" : "ready",
  );
  const [bootError, setBootError] = useState("");

  const submittedExamIds = useMemo(
    () => new Set(submissions.map((submission) => submission.examId)),
    [submissions],
  );

  const availableExams = useMemo(
    () => (useRemoteData ? remoteAvailableExams : examCatalog.filter((exam) => !submittedExamIds.has(exam.id))),
    [remoteAvailableExams, submittedExamIds, useRemoteData],
  );

  const pullRemoteSnapshot = useCallback(async () => {
    const [nextStudent, availableExamIds, submissionIds] = await Promise.all([
      fetchRemoteStudentProfile(),
      fetchRemoteAvailableExamIds(),
      fetchRemoteSubmissionIds(),
    ]);

    const [nextAvailableExams, nextSubmissions] = await Promise.all([
      Promise.all(availableExamIds.map((examId) => fetchRemoteExamById(examId))),
      Promise.all(submissionIds.map((submissionId) => fetchRemoteSubmissionById(submissionId))),
    ]);

    return {
      student: nextStudent,
      availableExams: nextAvailableExams,
      submissions: nextSubmissions.sort((left, right) => right.submittedAt - left.submittedAt),
    };
  }, []);

  const applyRemoteSnapshot = useCallback(
    (snapshot: { student: StudentProfile; availableExams: Exam[]; submissions: Submission[] }) => {
      setStudent(snapshot.student);
      setRemoteAvailableExams(snapshot.availableExams);
      setSubmissions(snapshot.submissions);
    },
    [],
  );

  useEffect(() => {
    if (!useRemoteData) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setBootStatus("loading");
      setBootError("");

      try {
        const snapshot = await pullRemoteSnapshot();

        if (!cancelled) {
          applyRemoteSnapshot(snapshot);
          setBootStatus("ready");
        }
      } catch (caughtError) {
        if (!cancelled) {
          setBootError(caughtError instanceof Error ? caughtError.message : "Өгөгдөл ачаалж чадсангүй.");
          setBootStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyRemoteSnapshot, pullRemoteSnapshot, useRemoteData]);

  const getExamById = useCallback((examId: string) => {
    const source = useRemoteData ? remoteAvailableExams : examCatalog;
    return source.find((exam) => exam.id === examId) ?? null;
  }, [remoteAvailableExams, useRemoteData]);

  const getSubmissionById = useCallback(
    (submissionId: string) => submissions.find((submission) => submission.id === submissionId) ?? null,
    [submissions],
  );

  const submitExam = useCallback<AppDataContextValue["submitExam"]>(async ({ examId, startedAt, answers }) => {
    if (useRemoteData) {
      const submission = await submitRemoteStudentExam({
        examId,
        startedAt,
        answers,
      });
      const snapshot = await pullRemoteSnapshot();
      applyRemoteSnapshot(snapshot);
      return { id: submission.id };
    }

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
  }, [applyRemoteSnapshot, pullRemoteSnapshot, useRemoteData]);

  const resetData = useCallback(() => {
    if (useRemoteData) {
      void (async () => {
        try {
          const snapshot = await pullRemoteSnapshot();
          applyRemoteSnapshot(snapshot);
        } catch {
          // Keep the current snapshot if refresh fails.
        }
      })();
      return;
    }

    setSubmissions([...seedSubmissions]);
  }, [applyRemoteSnapshot, pullRemoteSnapshot, useRemoteData]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      student,
      availableExams,
      submissions,
      getExamById,
      getSubmissionById,
      submitExam,
      resetData,
    }),
    [availableExams, getExamById, getSubmissionById, resetData, student, submitExam, submissions],
  );

  if (useRemoteData && bootStatus === "loading") {
    return <FullScreenLoader label="Жинхэнэ өгөгдлийг ачаалж байна..." />;
  }

  if (useRemoteData && bootStatus === "error") {
    return (
      <ConfigErrorScreen
        title="Өгөгдөл ачаалж чадсангүй"
        message={bootError || "Mobile app-ийн GraphQL тохиргоог шалгана уу."}
      />
    );
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData-г AppDataProvider-ийн дотор ашиглах ёстой.");
  }

  return context;
}
