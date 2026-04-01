import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { ConfigErrorScreen } from "@/components/ConfigErrorScreen";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { PrimaryButton } from "@/components/PrimaryButton";
import { examCatalog, seedSubmissions, studentProfile } from "@/data/student-data";
import type { Exam, StudentProfile, Submission } from "@/data/types";
import {
  clearLocalSubmissions,
  loadLocalSubmissions,
  loadRemoteSnapshot,
  saveLocalSubmissions,
  saveRemoteSnapshot,
} from "@/lib/app-storage";
import {
  changeRemoteStudentClassroom,
  fetchRemoteAvailableExams,
  fetchRemoteExamById,
  fetchRemoteStudentProfile,
  fetchRemoteSubmissionById,
  fetchRemoteSubmissions,
  getMobileRemoteConfig,
  submitRemoteStudentExam,
} from "@/lib/mobile-graphql";

type RemoteSnapshot = {
  student: StudentProfile;
  availableExams: Exam[];
  submissions: Submission[];
};

type AppDataContextValue = {
  isRemoteData: boolean;
  student: StudentProfile;
  availableExams: Exam[];
  submissions: Submission[];
  getExamById: (examId: string) => Exam | null;
  getSubmissionById: (submissionId: string) => Submission | null;
  ensureExamLoaded: (examId: string) => Promise<Exam | null>;
  ensureSubmissionLoaded: (submissionId: string) => Promise<Submission | null>;
  refreshData: () => Promise<void>;
  changeStudentClassroom: (inviteCode: string) => Promise<StudentProfile>;
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

function mergeExamCache(existing: Exam[], incoming: Exam[]) {
  const existingById = new Map(existing.map((exam) => [exam.id, exam]));

  return incoming.map((exam) => {
    const cachedExam = existingById.get(exam.id);

    if (cachedExam && cachedExam.questions.length > 0 && exam.questions.length === 0) {
      return {
        ...exam,
        questions: cachedExam.questions,
      };
    }

    return exam;
  });
}

function mergeSubmissionCache(existing: Submission[], incoming: Submission[]) {
  const existingById = new Map(existing.map((submission) => [submission.id, submission]));

  return incoming.map((submission) => {
    const cachedSubmission = existingById.get(submission.id);

    if (cachedSubmission && cachedSubmission.answers.length > 0 && submission.answers.length === 0) {
      return {
        ...submission,
        scheduledDate: cachedSubmission.scheduledDate ?? submission.scheduledDate,
        startTime: cachedSubmission.startTime ?? submission.startTime,
        answers: cachedSubmission.answers,
      };
    }

    return submission;
  });
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const remoteConfig = getMobileRemoteConfig();
  const useRemoteData = Boolean(remoteConfig);
  const [student, setStudent] = useState<StudentProfile>(studentProfile);
  const [submissions, setSubmissions] = useState<Submission[]>(() => [...seedSubmissions]);
  const [remoteAvailableExams, setRemoteAvailableExams] = useState<Exam[]>([]);
  const [bootStatus, setBootStatus] = useState<"loading" | "ready" | "error">("loading");
  const [bootError, setBootError] = useState("");
  const [bootAttempt, setBootAttempt] = useState(0);
  const studentRef = useRef(studentProfile);
  const submissionsRef = useRef<Submission[]>([...seedSubmissions]);
  const remoteAvailableExamsRef = useRef<Exam[]>([]);

  useEffect(() => {
    studentRef.current = student;
  }, [student]);

  useEffect(() => {
    submissionsRef.current = submissions;
  }, [submissions]);

  useEffect(() => {
    remoteAvailableExamsRef.current = remoteAvailableExams;
  }, [remoteAvailableExams]);

  const submittedExamIds = useMemo(
    () => new Set(submissions.map((submission) => submission.examId)),
    [submissions],
  );

  const availableExams = useMemo(
    () => (useRemoteData ? remoteAvailableExams : examCatalog.filter((exam) => !submittedExamIds.has(exam.id))),
    [remoteAvailableExams, submittedExamIds, useRemoteData],
  );

  const pullRemoteSnapshot = useCallback(async () => {
    const [nextStudent, nextAvailableExams, nextSubmissions] = await Promise.all([
      fetchRemoteStudentProfile(),
      fetchRemoteAvailableExams(),
      fetchRemoteSubmissions(),
    ]);

    return {
      student: nextStudent,
      availableExams: nextAvailableExams,
      submissions: nextSubmissions.sort((left, right) => right.submittedAt - left.submittedAt),
    };
  }, []);

  const applyRemoteSnapshot = useCallback((snapshot: RemoteSnapshot) => {
    const mergedSnapshot: RemoteSnapshot = {
      student: snapshot.student,
      availableExams: mergeExamCache(remoteAvailableExamsRef.current, snapshot.availableExams),
      submissions: mergeSubmissionCache(submissionsRef.current, snapshot.submissions),
    };

    studentRef.current = mergedSnapshot.student;
    remoteAvailableExamsRef.current = mergedSnapshot.availableExams;
    submissionsRef.current = mergedSnapshot.submissions;

    setStudent(mergedSnapshot.student);
    setRemoteAvailableExams(mergedSnapshot.availableExams);
    setSubmissions(mergedSnapshot.submissions);

    return mergedSnapshot;
  }, []);

  const refreshRemoteSnapshot = useCallback(async () => {
    const snapshot = await pullRemoteSnapshot();
    const mergedSnapshot = applyRemoteSnapshot(snapshot);
    await saveRemoteSnapshot(mergedSnapshot);
    return mergedSnapshot;
  }, [applyRemoteSnapshot, pullRemoteSnapshot]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setBootStatus("loading");
      setBootError("");

      if (!useRemoteData) {
        try {
          const cachedSubmissions = await loadLocalSubmissions();

          if (!cancelled) {
            setStudent(studentProfile);
            setRemoteAvailableExams([]);
            setSubmissions(cachedSubmissions ?? [...seedSubmissions]);
            setBootStatus("ready");
          }
        } catch {
          if (!cancelled) {
            setStudent(studentProfile);
            setRemoteAvailableExams([]);
            setSubmissions([...seedSubmissions]);
            setBootStatus("ready");
          }
        }

        return;
      }

      const cachedSnapshot = await loadRemoteSnapshot();

      if (!cancelled && cachedSnapshot) {
        applyRemoteSnapshot(cachedSnapshot);
        setBootStatus("ready");
      }

      try {
        const snapshot = await pullRemoteSnapshot();

        if (!cancelled) {
          const mergedSnapshot = applyRemoteSnapshot(snapshot);
          setBootStatus("ready");
          void saveRemoteSnapshot(mergedSnapshot);
        }
      } catch (caughtError) {
        if (!cancelled && !cachedSnapshot) {
          setBootError(caughtError instanceof Error ? caughtError.message : "Өгөгдөл ачаалж чадсангүй.");
          setBootStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyRemoteSnapshot, bootAttempt, pullRemoteSnapshot, useRemoteData]);

  useEffect(() => {
    if (!useRemoteData || bootStatus !== "ready") {
      return;
    }

    let cancelled = false;
    let inFlight = false;

    const refreshIfIdle = async () => {
      if (cancelled || inFlight) {
        return;
      }

      inFlight = true;

      try {
        await refreshRemoteSnapshot();
      } catch {
        // Keep the last good snapshot if background refresh fails.
      } finally {
        inFlight = false;
      }
    };

    const interval = setInterval(() => {
      void refreshIfIdle();
    }, 30_000);

    const appStateSubscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshIfIdle();
      }
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [bootStatus, refreshRemoteSnapshot, useRemoteData]);

  const getExamById = useCallback((examId: string) => {
    const source = useRemoteData ? remoteAvailableExams : examCatalog;
    return source.find((exam) => exam.id === examId) ?? null;
  }, [remoteAvailableExams, useRemoteData]);

  const getSubmissionById = useCallback(
    (submissionId: string) => submissions.find((submission) => submission.id === submissionId) ?? null,
    [submissions],
  );

  const ensureExamLoaded = useCallback(
    async (examId: string) => {
      const source = useRemoteData ? remoteAvailableExamsRef.current : examCatalog;
      const existingExam = source.find((exam) => exam.id === examId) ?? null;

      if (!existingExam || !useRemoteData || existingExam.questions.length > 0 || existingExam.questionCount === 0) {
        return existingExam;
      }

      const detailedExam = await fetchRemoteExamById(examId);
      const nextAvailableExams = remoteAvailableExamsRef.current.map((exam) =>
        exam.id === examId ? detailedExam : exam,
      );

      remoteAvailableExamsRef.current = nextAvailableExams;
      setRemoteAvailableExams(nextAvailableExams);

      await saveRemoteSnapshot({
        student: studentRef.current,
        availableExams: nextAvailableExams,
        submissions: submissionsRef.current,
      });

      return detailedExam;
    },
    [useRemoteData],
  );

  const ensureSubmissionLoaded = useCallback(
    async (submissionId: string) => {
      const existingSubmission = submissionsRef.current.find((submission) => submission.id === submissionId) ?? null;

      if (!existingSubmission || !useRemoteData || existingSubmission.answers.length > 0) {
        return existingSubmission;
      }

      const detailedSubmission = await fetchRemoteSubmissionById(submissionId);
      const nextSubmissions = submissionsRef.current.map((submission) =>
        submission.id === submissionId ? detailedSubmission : submission,
      );

      submissionsRef.current = nextSubmissions;
      setSubmissions(nextSubmissions);

      await saveRemoteSnapshot({
        student: studentRef.current,
        availableExams: remoteAvailableExamsRef.current,
        submissions: nextSubmissions,
      });

      return detailedSubmission;
    },
    [useRemoteData],
  );

  const refreshData = useCallback(async () => {
    if (useRemoteData) {
      await refreshRemoteSnapshot();
      return;
    }

    const cachedSubmissions = await loadLocalSubmissions();
    setStudent(studentProfile);
    setRemoteAvailableExams([]);
    setSubmissions(cachedSubmissions ?? [...seedSubmissions]);
  }, [refreshRemoteSnapshot, useRemoteData]);

  const submitExam = useCallback<AppDataContextValue["submitExam"]>(async ({ examId, startedAt, answers }) => {
    if (useRemoteData) {
      const submission = await submitRemoteStudentExam({
        examId,
        startedAt,
        answers,
      });
      await refreshRemoteSnapshot();
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

    const nextSubmissions = [
      nextSubmission,
      ...submissions.filter((submission) => submission.examId !== exam.id),
    ];

    setSubmissions(nextSubmissions);
    void saveLocalSubmissions(nextSubmissions);

    return { id: nextSubmission.id };
  }, [refreshRemoteSnapshot, submissions, useRemoteData]);

  const changeStudentClassroom = useCallback<AppDataContextValue["changeStudentClassroom"]>(async (inviteCode) => {
    if (!useRemoteData) {
      throw new Error("Анги солих нь зөвхөн backend-тэй горимд ажиллана.");
    }

    const nextStudent = await changeRemoteStudentClassroom(inviteCode);
    const snapshot = await pullRemoteSnapshot();
    const mergedSnapshot = applyRemoteSnapshot({
      ...snapshot,
      student: nextStudent,
    });
    await saveRemoteSnapshot(mergedSnapshot);
    return mergedSnapshot.student;
  }, [applyRemoteSnapshot, pullRemoteSnapshot, useRemoteData]);

  const resetData = useCallback(() => {
    if (useRemoteData) {
      void (async () => {
        try {
          await refreshRemoteSnapshot();
        } catch {
          // Keep the current snapshot if refresh fails.
        }
      })();
      return;
    }

    setSubmissions([...seedSubmissions]);
    void clearLocalSubmissions();
  }, [refreshRemoteSnapshot, useRemoteData]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      isRemoteData: useRemoteData,
      student,
      availableExams,
      submissions,
      getExamById,
      getSubmissionById,
      ensureExamLoaded,
      ensureSubmissionLoaded,
      refreshData,
      changeStudentClassroom,
      submitExam,
      resetData,
    }),
    [
      availableExams,
      ensureExamLoaded,
      ensureSubmissionLoaded,
      changeStudentClassroom,
      getExamById,
      getSubmissionById,
      refreshData,
      resetData,
      student,
      submitExam,
      submissions,
      useRemoteData,
    ],
  );

  if (bootStatus === "loading") {
    return (
      <FullScreenLoader
        label={useRemoteData ? "Жинхэнэ өгөгдлийг ачаалж байна..." : "Төхөөрөмжийн өгөгдлийг бэлдэж байна..."}
      />
    );
  }

  if (useRemoteData && bootStatus === "error") {
    return (
      <ConfigErrorScreen
        title="Өгөгдөл ачаалж чадсангүй"
        message={bootError || "Mobile app-ийн GraphQL тохиргоог шалгана уу."}
        action={
          <PrimaryButton
            label="Дахин оролдох"
            onPress={() => {
              setBootAttempt((current) => current + 1);
            }}
          />
        }
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
