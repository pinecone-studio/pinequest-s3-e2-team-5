"use client";

import { gql } from "@apollo/client";
import type { Reference } from "@apollo/client/cache";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AlignLeft,
  ChevronDown,
  ChevronLeft,
  CircleDot,
  FileText,
  Image as ImageIcon,
  PencilLine,
  Plus,
  Sigma,
  Trash2,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApolloErrorMessage } from "@/lib/apollo-error";

type QuestionType = "mcq" | "open" | "short";

type ChoiceDraft = {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
  imageUrl: string;
  videoUrl: string;
  imageFileName: string;
  videoFileName: string;
  showImageInput: boolean;
  showVideoInput: boolean;
};

type QuestionDraft = {
  id: string;
  question: string;
  type: QuestionType;
  topic: string;
  difficulty: string;
  imageUrl: string;
  videoUrl: string;
  imageFileName: string;
  videoFileName: string;
  showImageInput: boolean;
  showVideoInput: boolean;
  points: number;
  choices: ChoiceDraft[];
};

type ExamByIdData = {
  teacherExamDetail: {
    exam: {
      id: string;
      title: string;
      subject: string;
      description: string | null;
      duration: number;
      grade: string;
    };
    questions: {
      id: string;
      type: QuestionType;
      prompt: string;
      order: number;
      correctChoiceId: string | null;
      choices: {
        id: string;
        label: string;
        text: string;
        isCorrect: boolean;
      }[];
    }[];
  };
};

type CreateQuestionWithChoicesData = {
  createQuestionWithChoices: {
    id: string;
  };
};

type UpdateQuestionWithChoicesData = {
  updateQuestionWithChoices: {
    id: string;
  };
};

type UpdateExamData = {
  updateExam: {
    id: string;
    title: string;
    subject: string;
    description: string | null;
    duration: number;
    grade: string;
  };
};

type DeleteQuestionData = {
  deleteQuestion: {
    id: string;
  };
};

type DeleteExamData = {
  deleteExam: {
    __typename?: "Exam";
    id: string;
  };
};

const GET_EXAM_BY_ID = gql`
  query GetTeacherExamEditData($examId: String!) {
    teacherExamDetail(examId: $examId) {
      exam {
        id
        title
        subject
        description
        duration
        grade
      }
      questions {
        id
        type
        prompt
        order
        correctChoiceId
        choices {
          id
          label
          text
          isCorrect
        }
      }
    }
  }
`;

const CREATE_QUESTION_WITH_CHOICES = gql`
  mutation CreateQuestionWithChoices($input: createQuestionInput!) {
    createQuestionWithChoices(input: $input) {
      id
    }
  }
`;

const UPDATE_QUESTION_WITH_CHOICES = gql`
  mutation UpdateQuestionWithChoices($input: updateQuestionInput!) {
    updateQuestionWithChoices(input: $input) {
      id
    }
  }
`;

const UPDATE_EXAM = gql`
  mutation UpdateExam($input: updateExamInput!) {
    updateExam(input: $input) {
      id
      title
      subject
      description
      duration
      grade
    }
  }
`;

const DELETE_QUESTION = gql`
  mutation DeleteQuestion($questionId: String!) {
    deleteQuestion(questionId: $questionId) {
      id
    }
  }
`;

const DELETE_EXAM = gql`
  mutation DeleteExam($examId: String!) {
    deleteExam(examId: $examId) {
      id
    }
  }
`;

const typeOptions: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "Сонголт" },
  { value: "open", label: "Бичих" },
  { value: "short", label: "Богино" },
];

const subjectOptions = [
  { value: "social", label: "Нийгэм" },
  { value: "civics", label: "Иргэний боловсрол" },
  { value: "math", label: "Математик" },
  { value: "english", label: "Англи хэл" },
  { value: "chemistry", label: "Хими" },
  { value: "physics", label: "Физик" },
] as const;

const gradeOptions = [
  "9-р анги",
  "10-р анги",
  "11-р анги",
  "12-р анги",
] as const;

const durationOptions = [30, 45, 60, 90, 120] as const;

const insertMenuOptions = [
  { key: "formula", label: "Томьёо", icon: Sigma },
  { key: "image", label: "Зураг", icon: ImageIcon },
  { key: "video", label: "Бичлэг", icon: Video },
  { key: "pdf", label: "PDF", icon: FileText },
] as const;
type InsertMenuKey = (typeof insertMenuOptions)[number]["key"];
type MediaInsertKey = Extract<InsertMenuKey, "image" | "video">;

const fieldClassName =
  "h-[56px] w-full rounded-[18px] border border-[#E8E2F1] bg-white px-4 text-[18px] text-[#1A1623] outline-none transition placeholder:text-[#8E8A94] focus:border-[#B59AF8] focus:ring-4 focus:ring-[#B59AF8]/15";
const examDialogFieldClassName =
  "h-[56px] w-full rounded-[16px] border border-[#E9E0F7] bg-white px-4 text-[16px] text-[#1A1623] outline-none transition placeholder:text-[#8E8A94] focus:border-[#B69AF8] focus:ring-4 focus:ring-[#B69AF8]/15";

function createChoice(label: string): ChoiceDraft {
  return {
    id: crypto.randomUUID(),
    label,
    text: "",
    isCorrect: label === "A",
    imageUrl: "",
    videoUrl: "",
    imageFileName: "",
    videoFileName: "",
    showImageInput: false,
    showVideoInput: false,
  };
}

function createBlankChoice(): ChoiceDraft {
  return {
    id: crypto.randomUUID(),
    label: "",
    text: "",
    isCorrect: false,
    imageUrl: "",
    videoUrl: "",
    imageFileName: "",
    videoFileName: "",
    showImageInput: false,
    showVideoInput: false,
  };
}

function createQuestionDraft(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    question: "",
    type: "mcq",
    topic: "",
    difficulty: "",
    imageUrl: "",
    videoUrl: "",
    imageFileName: "",
    videoFileName: "",
    showImageInput: false,
    showVideoInput: false,
    points: 1,
    choices: createDefaultMcqChoices(),
  };
}

function createDefaultMcqChoices() {
  return ["A", "B"].map(createChoice);
}

function createQuestionDraftFromServer(
  question: ExamByIdData["teacherExamDetail"]["questions"][number],
): QuestionDraft {
  return {
    id: question.id,
    question: question.prompt,
    type: question.type,
    topic: "",
    difficulty: "",
    imageUrl: "",
    videoUrl: "",
    imageFileName: "",
    videoFileName: "",
    showImageInput: false,
    showVideoInput: false,
    points: 1,
    choices: normalizeQuestionChoices(
      question.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        text: choice.text,
        isCorrect: choice.isCorrect,
        imageUrl: "",
        videoUrl: "",
        imageFileName: "",
        videoFileName: "",
        showImageInput: false,
        showVideoInput: false,
      })),
    ),
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Файлыг уншиж чадсангүй."));
    };

    reader.onerror = () => reject(new Error("Файлыг уншихад алдаа гарлаа."));
    reader.readAsDataURL(file);
  });
}

function normalizeQuestionChoices(choices: ChoiceDraft[]) {
  return choices.map((choice, index) => ({
    ...choice,
    label: String.fromCharCode(65 + index),
  }));
}

function getSubjectLabel(subject: string) {
  if (subject === "social") {
    return "Нийгэм";
  }

  if (subject === "civics") {
    return "Иргэний боловсрол";
  }

  return subject;
}

function getQuestionTypeLabel(type: QuestionType) {
  if (type === "mcq") {
    return "Сонголт";
  }

  if (type === "short") {
    return "Богино";
  }

  return "Бичих";
}

export default function TeacherExamEditPage() {
  const params = useParams<{ examId: string }>();
  const searchParams = useSearchParams();
  const examId = Array.isArray(params.examId) ? params.examId[0] : params.examId;
  const requestedQuestionId = searchParams.get("questionId");
  const router = useRouter();

  const [fallbackQuestion] = useState<QuestionDraft>(() => createQuestionDraft());
  const [draftQuestions, setDraftQuestions] = useState<QuestionDraft[] | null>(
    null,
  );
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [examMeta, setExamMeta] = useState<ExamByIdData["teacherExamDetail"]["exam"] | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editDuration, setEditDuration] = useState(60);
  const [editUploadedFileName, setEditUploadedFileName] = useState("");
  const [editExamError, setEditExamError] = useState("");
  const [deleteExamError, setDeleteExamError] = useState("");
  const [savedQuestionIds, setSavedQuestionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [dirtyQuestionIds, setDirtyQuestionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);
  const [choiceInsertMenuTargetId, setChoiceInsertMenuTargetId] = useState<
    string | null
  >(null);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const insertMenuRef = useRef<HTMLDivElement | null>(null);
  const choiceInsertMenuRef = useRef<HTMLDivElement | null>(null);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);
  const choiceInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const choiceIdToFocusRef = useRef<string | null>(null);

  const {
    data: examData,
    loading: examLoading,
    error: examError,
    refetch: refetchExam,
  } =
    useQuery<ExamByIdData>(GET_EXAM_BY_ID, {
      variables: { examId },
      skip: !examId,
    });

  const [createQuestionWithChoices, { loading: saveQuestionLoading }] =
    useMutation<CreateQuestionWithChoicesData>(CREATE_QUESTION_WITH_CHOICES);
  const [updateQuestionWithChoices, { loading: updateQuestionLoading }] =
    useMutation<UpdateQuestionWithChoicesData>(UPDATE_QUESTION_WITH_CHOICES);
  const [updateExam, { loading: updateExamLoading }] =
    useMutation<UpdateExamData>(UPDATE_EXAM);
  const [deleteQuestion, { loading: deleteQuestionLoading }] =
    useMutation<DeleteQuestionData>(DELETE_QUESTION);
  const [deleteExam, { loading: deleteExamLoading }] =
    useMutation<DeleteExamData>(DELETE_EXAM);

  const serverQuestions = useMemo(
    () => examData?.teacherExamDetail.questions.map(createQuestionDraftFromServer) ?? [],
    [examData],
  );
  const questions = useMemo(() => {
    if (draftQuestions) {
      return draftQuestions;
    }

    if (serverQuestions.length > 0) {
      return serverQuestions;
    }

    return [fallbackQuestion];
  }, [draftQuestions, fallbackQuestion, serverQuestions]);
  const effectiveSavedQuestionIds = useMemo(() => {
    const next = new Set(serverQuestions.map((question) => question.id));

    for (const questionId of savedQuestionIds) {
      next.add(questionId);
    }

    return next;
  }, [savedQuestionIds, serverQuestions]);
  const isSavingQuestion = saveQuestionLoading || updateQuestionLoading;

  const activeQuestion = useMemo(() => {
    const fallback = questions[0] ?? null;
    const resolvedId =
      activeQuestionId ?? requestedQuestionId ?? fallback?.id ?? null;

    if (!resolvedId) {
      return null;
    }

    return questions.find((question) => question.id === resolvedId) ?? fallback;
  }, [activeQuestionId, questions, requestedQuestionId]);

  const activeQuestionIndex = useMemo(() => {
    if (!activeQuestion) {
      return -1;
    }

    return questions.findIndex((question) => question.id === activeQuestion.id);
  }, [activeQuestion, questions]);

  const totalPoints = useMemo(() => {
    return questions.reduce((sum, question) => sum + question.points, 0);
  }, [questions]);

  const updateQuestions = (
    updater: (current: QuestionDraft[]) => QuestionDraft[],
  ) => {
    setDraftQuestions((current) => {
      const base =
        current ?? (serverQuestions.length > 0 ? serverQuestions : [fallbackQuestion]);
      return updater(base);
    });
  };

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;

      if (
        insertMenuRef.current &&
        target instanceof Node &&
        !insertMenuRef.current.contains(target)
      ) {
        setIsInsertMenuOpen(false);
      }

      if (
        choiceInsertMenuRef.current &&
        target instanceof Node &&
        !choiceInsertMenuRef.current.contains(target)
      ) {
        setChoiceInsertMenuTargetId(null);
      }

      if (
        typeMenuRef.current &&
        target instanceof Node &&
        !typeMenuRef.current.contains(target)
      ) {
        setIsTypeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const updateActiveQuestion = (
    updater: (question: QuestionDraft) => QuestionDraft,
  ) => {
    if (!activeQuestion) {
      return;
    }

    updateQuestions((current) =>
      current.map((question) =>
        question.id === activeQuestion.id ? updater(question) : question,
      ),
    );

    if (effectiveSavedQuestionIds.has(activeQuestion.id)) {
      setDirtyQuestionIds((current) => {
        const next = new Set(current);
        next.add(activeQuestion.id);
        return next;
      });
    }
  };

  const updateQuestionById = (
    questionId: string,
    updater: (question: QuestionDraft) => QuestionDraft,
  ) => {
    updateQuestions((current) =>
      current.map((question) =>
        question.id === questionId ? updater(question) : question,
      ),
    );

    if (effectiveSavedQuestionIds.has(questionId)) {
      setDirtyQuestionIds((current) => {
        const next = new Set(current);
        next.add(questionId);
        return next;
      });
    }
  };

  const closeMenus = () => {
    setIsInsertMenuOpen(false);
    setChoiceInsertMenuTargetId(null);
    setIsTypeMenuOpen(false);
  };

  const addQuestion = () => {
    const nextQuestion = createQuestionDraft();
    updateQuestions((current) => [...current, nextQuestion]);
    setActiveQuestionId(nextQuestion.id);
    setStatusMessage("");
    closeMenus();
  };

  const removeQuestionLocally = (questionId: string) => {
    const currentIndex = questions.findIndex((question) => question.id === questionId);

    updateQuestions((current) => current.filter((question) => question.id !== questionId));
    setSavedQuestionIds((current) => {
      const next = new Set(current);
      next.delete(questionId);
      return next;
    });
    setDirtyQuestionIds((current) => {
      const next = new Set(current);
      next.delete(questionId);
      return next;
    });

    const nextQuestion =
      questions[currentIndex + 1] ??
      questions[currentIndex - 1] ??
      null;

    setActiveQuestionId(nextQuestion?.id ?? null);
    closeMenus();
  };

  const handleDeleteActiveQuestion = async () => {
    if (!activeQuestion) {
      return;
    }

    if (!window.confirm("Энэ асуултыг устгах уу?")) {
      return;
    }

    if (!effectiveSavedQuestionIds.has(activeQuestion.id)) {
      removeQuestionLocally(activeQuestion.id);
      setStatusMessage("Асуултын draft устгагдлаа.");
      return;
    }

    try {
      setStatusMessage("Асуулт устгаж байна...");
      await deleteQuestion({
        variables: {
          questionId: activeQuestion.id,
        },
      });
      removeQuestionLocally(activeQuestion.id);
      await refetchExam();
      setStatusMessage("Асуулт устгагдлаа.");
    } catch (error) {
      setStatusMessage(
        getApolloErrorMessage(error, "Асуулт устгахад алдаа гарлаа."),
      );
    }
  };

  const openExamEditDialog = () => {
    const source = examMeta ?? examData?.teacherExamDetail.exam;

    if (!source) {
      return;
    }

    setEditSubject(source.subject);
    setEditTitle(source.title);
    setEditGrade(source.grade);
    setEditDuration(source.duration);
    setEditUploadedFileName(
      source.description?.startsWith("Файл: ")
        ? source.description.replace("Файл: ", "")
        : "",
    );
    setEditExamError("");
    setIsExamDialogOpen(true);
  };

  const handleDeleteExam = async () => {
    if (!window.confirm("Энэ шалгалтыг бүх асуулттай нь устгах уу?")) {
      return;
    }

    try {
      setDeleteExamError("");
      await deleteExam({
        variables: { examId },
        optimisticResponse: {
          deleteExam: {
            __typename: "Exam",
            id: examId,
          },
        },
        update(cache) {
          cache.modify({
            fields: {
              myExams(existingRefs: readonly Reference[] = [], { readField }) {
                return existingRefs.filter(
                  (reference) => readField("id", reference) !== examId,
                );
              },
              teacherScheduledExams(
                existingRefs: readonly Reference[] = [],
                { readField },
              ) {
                return existingRefs.filter(
                  (reference) => readField("id", reference) !== examId,
                );
              },
            },
          });
          cache.evict({
            id: cache.identify({ __typename: "Exam", id: examId }),
          });
          cache.gc();
        },
      });
      router.push("/teacher/exams");
    } catch (error) {
      setDeleteExamError(
        getApolloErrorMessage(error, "Шалгалт устгахад алдаа гарлаа."),
      );
    }
  };

  const handleUpdateExam = async () => {
    if (!examId) {
      setEditExamError("Шалгалтын ID олдсонгүй.");
      return;
    }

    if (!editSubject || !editTitle.trim() || !editGrade || editDuration <= 0) {
      setEditExamError("Хичээл, сэдэв, анги, хугацааг бүрэн бөглөнө үү.");
      return;
    }

    try {
      setEditExamError("");

      const res = await updateExam({
        variables: {
          input: {
            examId,
            title: editTitle.trim(),
            subject: editSubject,
            description: editUploadedFileName
              ? `Файл: ${editUploadedFileName}`
              : "",
            duration: editDuration,
            grade: editGrade,
          },
        },
      });

      if (res.data?.updateExam) {
        setExamMeta(res.data.updateExam);
        setIsExamDialogOpen(false);
        return;
      }

      setEditExamError("Шалгалтын мэдээлэл шинэчлэгдсэнгүй.");
    } catch (error) {
      setEditExamError(
        getApolloErrorMessage(error, "Шалгалтын мэдээлэл шинэчлэхэд алдаа гарлаа."),
      );
    }
  };

  const addChoice = (afterChoiceId?: string) => {
    const nextChoice = createBlankChoice();

    updateActiveQuestion((question) => {
      const nextChoices = [...normalizeQuestionChoices(question.choices)];

      if (afterChoiceId) {
        const insertIndex = nextChoices.findIndex(
          (choice) => choice.id === afterChoiceId,
        );

        if (insertIndex >= 0) {
          nextChoices.splice(insertIndex + 1, 0, nextChoice);
        } else {
          nextChoices.push(nextChoice);
        }
      } else {
        nextChoices.push(nextChoice);
      }

      return {
        ...question,
        choices: normalizeQuestionChoices(nextChoices),
      };
    });

    choiceIdToFocusRef.current = nextChoice.id;
    setChoiceInsertMenuTargetId(null);
  };

  const showQuestionMediaInput = (key: InsertMenuKey) => {
    if (key === "formula") {
      setStatusMessage("Mathlive суулгасны дараа томьёоны keyboard холбоно.");
      setIsInsertMenuOpen(false);
      return;
    }

    if (key === "pdf") {
      setStatusMessage("PDF хэсгийг дараагийн алхамд холбоно.");
      setIsInsertMenuOpen(false);
      return;
    }

    updateActiveQuestion((question) => ({
      ...question,
      showImageInput: key === "image" ? true : question.showImageInput,
      showVideoInput: key === "video" ? true : question.showVideoInput,
    }));
    setIsInsertMenuOpen(false);
  };

  const hideQuestionMediaInput = (key: MediaInsertKey) => {
    updateActiveQuestion((question) => ({
      ...question,
      imageUrl: key === "image" ? "" : question.imageUrl,
      videoUrl: key === "video" ? "" : question.videoUrl,
      imageFileName: key === "image" ? "" : question.imageFileName,
      videoFileName: key === "video" ? "" : question.videoFileName,
      showImageInput: key === "image" ? false : question.showImageInput,
      showVideoInput: key === "video" ? false : question.showVideoInput,
    }));
  };

  const showChoiceMediaInput = (choiceId: string, key: InsertMenuKey) => {
    if (key === "formula") {
      setStatusMessage("Mathlive суулгасны дараа томьёоны keyboard холбоно.");
      setChoiceInsertMenuTargetId(null);
      return;
    }

    if (key === "pdf") {
      setStatusMessage("PDF хэсгийг дараагийн алхамд холбоно.");
      setChoiceInsertMenuTargetId(null);
      return;
    }

    updateActiveQuestion((question) => ({
      ...question,
      choices: normalizeQuestionChoices(
        question.choices.map((choice) =>
          choice.id === choiceId
            ? {
                ...choice,
                showImageInput:
                  key === "image" ? true : choice.showImageInput,
                showVideoInput:
                  key === "video" ? true : choice.showVideoInput,
              }
            : choice,
        ),
      ),
    }));
    setChoiceInsertMenuTargetId(null);
  };

  const hideChoiceMediaInput = (choiceId: string, key: MediaInsertKey) => {
    updateActiveQuestion((question) => ({
      ...question,
      choices: normalizeQuestionChoices(
        question.choices.map((choice) =>
          choice.id === choiceId
            ? {
                ...choice,
                imageUrl: key === "image" ? "" : choice.imageUrl,
                videoUrl: key === "video" ? "" : choice.videoUrl,
                imageFileName: key === "image" ? "" : choice.imageFileName,
                videoFileName: key === "video" ? "" : choice.videoFileName,
                showImageInput:
                  key === "image" ? false : choice.showImageInput,
                showVideoInput:
                  key === "video" ? false : choice.showVideoInput,
              }
            : choice,
        ),
      ),
    }));
  };

  const handleQuestionAttachmentSelect = async (
    questionId: string,
    key: MediaInsertKey,
    file?: File,
  ) => {
    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      updateQuestionById(questionId, (question) => ({
        ...question,
        imageUrl: key === "image" ? dataUrl : question.imageUrl,
        videoUrl: key === "video" ? dataUrl : question.videoUrl,
        imageFileName: key === "image" ? file.name : question.imageFileName,
        videoFileName: key === "video" ? file.name : question.videoFileName,
        showImageInput: key === "image" ? true : question.showImageInput,
        showVideoInput: key === "video" ? true : question.showVideoInput,
      }));
      setStatusMessage("");
    } catch (error) {
      setStatusMessage(
        getApolloErrorMessage(error, "Файл уншихад алдаа гарлаа."),
      );
    }
  };

  const handleChoiceAttachmentSelect = async (
    questionId: string,
    choiceId: string,
    key: MediaInsertKey,
    file?: File,
  ) => {
    if (!file) {
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      updateQuestionById(questionId, (question) => ({
        ...question,
        choices: normalizeQuestionChoices(
          question.choices.map((choice) =>
            choice.id === choiceId
              ? {
                  ...choice,
                  imageUrl: key === "image" ? dataUrl : choice.imageUrl,
                  videoUrl: key === "video" ? dataUrl : choice.videoUrl,
                  imageFileName:
                    key === "image" ? file.name : choice.imageFileName,
                  videoFileName:
                    key === "video" ? file.name : choice.videoFileName,
                  showImageInput:
                    key === "image" ? true : choice.showImageInput,
                  showVideoInput:
                    key === "video" ? true : choice.showVideoInput,
                }
              : choice,
          ),
        ),
      }));
      setStatusMessage("");
    } catch (error) {
      setStatusMessage(
        getApolloErrorMessage(error, "Файл уншихад алдаа гарлаа."),
      );
    }
  };

  const removeChoice = (choiceId: string) => {
    updateActiveQuestion((question) => {
      if (question.choices.length <= 2) {
        return question;
      }

      const nextChoices = normalizeQuestionChoices(
        question.choices.filter((choice) => choice.id !== choiceId),
      );
      const hasCorrect = nextChoices.some((choice) => choice.isCorrect);

      return {
        ...question,
        choices: hasCorrect
          ? nextChoices
          : nextChoices.map((choice, index) => ({
              ...choice,
              isCorrect: index === 0,
            })),
      };
    });
  };

  const handleSave = async () => {
    if (!examId) {
      setStatusMessage("Шалгалтын ID олдсонгүй.");
      return;
    }

    if (!activeQuestion) {
      setStatusMessage("Хадгалах асуулт сонгогдоогүй байна.");
      return;
    }

    const moveToNextQuestion = () => {
      const nextQuestion = questions[activeQuestionIndex + 1];

      if (nextQuestion) {
        setActiveQuestionId(nextQuestion.id);
      } else {
        const freshQuestion = createQuestionDraft();
        updateQuestions((current) => [...current, freshQuestion]);
        setActiveQuestionId(freshQuestion.id);
      }

      closeMenus();
    };

    if (!activeQuestion.question.trim()) {
      setStatusMessage(`${activeQuestionIndex + 1}-р асуулт хоосон байна.`);
      return;
    }

    if (
      activeQuestion.type === "mcq" &&
      (!activeQuestion.choices.length ||
        activeQuestion.choices.some((choice) => !choice.text.trim()) ||
        !activeQuestion.choices.some((choice) => choice.isCorrect))
    ) {
      setStatusMessage(
        `${activeQuestionIndex + 1}-р асуултын хариултуудыг бөглөж, зөв хариултыг сонгоно уу.`,
      );
      return;
    }

    const questionInput = {
      examId,
      indexOnExam: activeQuestionIndex + 1,
      question: activeQuestion.question.trim(),
      type: activeQuestion.type,
      topic: activeQuestion.topic?.trim() || null,
      difficulty: activeQuestion.difficulty?.trim() || null,
      imageUrl: activeQuestion.imageUrl?.trim() || null,
      videoUrl: activeQuestion.videoUrl?.trim() || null,
      choices:
        activeQuestion.type === "mcq"
          ? normalizeQuestionChoices(activeQuestion.choices).map((choice) => ({
              id: choice.id,
              label: choice.label,
              text: choice.text.trim(),
              isCorrect: choice.isCorrect,
              imageUrl: choice.imageUrl?.trim() || null,
              videoUrl: choice.videoUrl?.trim() || null,
            }))
          : [],
    };

    if (effectiveSavedQuestionIds.has(activeQuestion.id)) {
      if (dirtyQuestionIds.has(activeQuestion.id)) {
        try {
          setStatusMessage("Асуулт хадгалж байна...");

          await updateQuestionWithChoices({
            variables: {
              input: {
                questionId: activeQuestion.id,
                ...questionInput,
              },
            },
          });
          await refetchExam();

          setDirtyQuestionIds((current) => {
            const next = new Set(current);
            next.delete(activeQuestion.id);
            return next;
          });
          setStatusMessage("Асуулт шинэчлэгдлээ. Дараагийн асуулт руу шилжив.");
          moveToNextQuestion();
        } catch (error) {
          setStatusMessage(
            getApolloErrorMessage(error, "Асуултууд хадгалахад алдаа гарлаа."),
          );
        }
        return;
      }

      moveToNextQuestion();
      return;
    }

    try {
      setStatusMessage("Асуулт хадгалж байна...");

      const res = await createQuestionWithChoices({
        variables: {
          input: questionInput,
        },
      });
      const createdQuestionId = res.data?.createQuestionWithChoices.id;

      if (!createdQuestionId) {
        setStatusMessage("Асуултын ID буцаагдсангүй.");
        return;
      }

      updateQuestionById(activeQuestion.id, (question) => ({
        ...question,
        id: createdQuestionId,
      }));

      setSavedQuestionIds((current) => {
        const next = new Set(current);
        next.delete(activeQuestion.id);
        next.add(createdQuestionId);
        return next;
      });
      setDirtyQuestionIds((current) => {
        const next = new Set(current);
        next.delete(activeQuestion.id);
        next.delete(createdQuestionId);
        return next;
      });
      await refetchExam();
      setStatusMessage("Асуулт хадгалагдлаа. Дараагийн асуулт руу шилжив.");
      moveToNextQuestion();
    } catch (error) {
      setStatusMessage(
        getApolloErrorMessage(error, "Асуултууд хадгалахад алдаа гарлаа."),
      );
    }
  };

  if (examLoading) {
    return <main className="p-8 text-sm text-[#6F687D]">Уншиж байна...</main>;
  }

  if (examError || !examData?.teacherExamDetail) {
    return (
      <main className="p-8 text-sm text-red-600">
        {getApolloErrorMessage(examError, "Шалгалт ачаалж чадсангүй.")}
      </main>
    );
  }

  const resolvedExamMeta = examMeta ?? examData.teacherExamDetail.exam;

  return (
    <section className="space-y-6">
      <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-[calc(100%-2rem)] rounded-[24px] border border-[#E8E2F1] bg-white px-6 py-6 shadow-[0_20px_70px_rgba(28,18,54,0.18)] sm:max-w-[580px]"
        >
          <DialogHeader className="gap-0">
            <DialogTitle className="text-[28px] font-semibold tracking-tight text-[#111111]">
              Үндсэн мэдээлэл
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3 space-y-5">
            <div className="space-y-2.5">
              <label className="block text-[16px] font-medium text-[#111111]">
                Хичээл
              </label>
              <div className="relative">
                <select
                  value={editSubject}
                  onChange={(event) => setEditSubject(event.target.value)}
                  className={`${examDialogFieldClassName} appearance-none pr-14 ${
                    editSubject ? "" : "text-[#8E8A94]"
                  }`}
                >
                  <option value="" disabled>
                    Хичээл сонгох
                  </option>
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-[16px] font-medium text-[#111111]">
                Сэдвийн нэр
              </label>
              <input
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="Жишээ: Алгебр Тест-1"
                className={examDialogFieldClassName}
              />
            </div>

            <div className="space-y-2.5">
              <label className="block text-[16px] font-medium text-[#111111]">
                Анги
              </label>
              <div className="relative">
                <select
                  value={editGrade}
                  onChange={(event) => setEditGrade(event.target.value)}
                  className={`${examDialogFieldClassName} appearance-none pr-14 ${
                    editGrade ? "" : "text-[#8E8A94]"
                  }`}
                >
                  <option value="" disabled>
                    Анги сонгох
                  </option>
                  {gradeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-[16px] font-medium text-[#111111]">
                Файл
              </label>
              <label className="flex h-[56px] w-full cursor-pointer items-center gap-3 rounded-[16px] border border-[#E9E0F7] bg-white px-4 text-[16px] text-[#6E6A74] transition hover:border-[#D6C9F6]">
                <FileText className="h-5 w-5 text-[#6E6A74]" />
                <span>{editUploadedFileName || "Файл оруулах"}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) =>
                    setEditUploadedFileName(
                      event.target.files?.[0]?.name ?? "",
                    )
                  }
                />
              </label>
            </div>

            <div className="space-y-2.5">
              <label className="block text-[16px] font-medium text-[#111111]">
                Хугацаа(минут)
              </label>
              <div className="relative">
                <select
                  value={String(editDuration)}
                  onChange={(event) => setEditDuration(Number(event.target.value))}
                  className={`${examDialogFieldClassName} appearance-none pr-14`}
                >
                  {durationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8E8A94]" />
              </div>
            </div>
          </div>

          {editExamError ? (
            <p className="mt-4 text-[14px] text-[#D25B56]">{editExamError}</p>
          ) : null}

          <div className="-mx-6 -mb-6 mt-8 flex items-center justify-end gap-6 border-t border-[#ECE6F3] px-6 py-5">
            <button
              type="button"
              onClick={() => setIsExamDialogOpen(false)}
              className="text-[18px] font-medium text-[#111111] transition hover:text-[#7E66DC]"
            >
              Буцах
            </button>
            <button
              type="button"
              onClick={handleUpdateExam}
              disabled={updateExamLoading}
              className="inline-flex h-12 items-center justify-center rounded-[20px] bg-[#9E81F0] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(103,79,184,0.32),0_12px_22px_rgba(158,129,240,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {updateExamLoading ? "Хадгалж байна..." : "Үргэлжлүүлэх"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div>
        <Link
          href="/teacher/exams"
          className="inline-flex items-center gap-3 text-[18px] font-medium text-[#36313F] transition hover:text-[#7E66DC]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F0FA]">
            <ChevronLeft className="h-5 w-5" />
          </span>
          Буцах
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="self-start lg:sticky lg:top-28">
          <div className="space-y-4">
            <section className="rounded-[18px] border border-[#E8E2F1] bg-white p-5 shadow-[0_4px_12px_rgba(53,31,107,0.04)]">
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-end justify-between gap-4 text-[15px] text-[#23202A]">
                    <span className="relative pb-1 font-semibold after:absolute after:bottom-0 after:left-0 after:h-[4px] after:w-full after:rounded-full after:bg-[#CFC5F8]">
                      Хичээл
                    </span>
                    <span className="text-right text-[15px]">
                      {getSubjectLabel(resolvedExamMeta.subject)}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4 text-[15px] text-[#23202A]">
                    <span className="font-medium">Сэдэв</span>
                    <span className="text-right text-[15px]">
                      {resolvedExamMeta.title}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4 text-[15px] text-[#23202A]">
                    <span className="font-medium">Анги</span>
                    <span className="text-right text-[15px]">
                      {resolvedExamMeta.grade}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-[#ECE6F3]" />

                <div className="space-y-2.5">
                  <div className="flex items-end justify-between gap-4 text-[15px] text-[#23202A]">
                    <span className="font-medium">Хугацаа</span>
                    <span className="text-right text-[15px]">
                      {resolvedExamMeta.duration} мин
                    </span>
                  </div>
                </div>

                <div className="h-px bg-[#ECE6F3]" />

                <div className="space-y-2.5">
                  <div className="flex items-end justify-between gap-4 text-[15px] text-[#23202A]">
                    <span className="font-semibold">Нийт даалгал</span>
                    <span className="text-right text-[15px]">
                      {questions.length}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-4 text-[15px] text-[#23202A]">
                    <span className="font-semibold">Оноо</span>
                    <span className="text-right text-[15px]">{totalPoints}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-5 text-[#7F7A89]">
                <button
                  type="button"
                  onClick={openExamEditDialog}
                  className="transition hover:text-[#7E66DC]"
                  aria-label="Шалгалтын мэдээлэл засах"
                >
                  <PencilLine className="h-6 w-6" strokeWidth={1.9} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteExam()}
                  disabled={deleteExamLoading}
                  className="transition hover:text-[#DE5A52] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Шалгалт устгах"
                >
                  <Trash2 className="h-6 w-6" strokeWidth={1.9} />
                </button>
              </div>

              {deleteExamError ? (
                <p className="mt-4 text-[14px] text-[#D25B56]">{deleteExamError}</p>
              ) : null}
            </section>

            <section className="rounded-[18px] border border-[#E8E2F1] bg-white p-5 shadow-[0_4px_12px_rgba(53,31,107,0.04)]">
              <p className="text-[17px] font-semibold text-[#23202A]">Асуулт</p>

              <div className="mt-4 grid grid-cols-5 gap-3">
                {questions.map((question, index) => {
                  const isActive = question.id === activeQuestion?.id;

                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => {
                        setActiveQuestionId(question.id);
                        closeMenus();
                      }}
                      className={`flex h-11 w-11 items-center justify-center rounded-[10px] border text-[15px] font-medium transition ${
                        isActive
                          ? "border-[#9077F7] bg-[#F0EEFF] text-[#6F5DE2]"
                          : "border-[#E8E2F1] bg-white text-[#2A2732] hover:border-[#D6CFF3]"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#E8E2F1] bg-white text-[#2A2732] transition hover:border-[#D6CFF3] hover:text-[#7E66DC]"
                  aria-label="Асуулт нэмэх"
                >
                  <Plus className="h-6 w-6" strokeWidth={1.8} />
                </button>
              </div>
            </section>
          </div>
        </aside>

        <section className="rounded-[18px] border border-[#E8E2F1] bg-white p-6 shadow-[0_4px_12px_rgba(53,31,107,0.04)]">
          {activeQuestion ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <h1 className="text-[18px] font-semibold text-[#1F1B27]">
                  Асуулт {activeQuestionIndex + 1}
                </h1>

                <div className="flex items-center gap-4 text-[#6F687D]">
                  <button
                    type="button"
                    onClick={() => void handleDeleteActiveQuestion()}
                    disabled={deleteQuestionLoading}
                    className="transition hover:text-[#DE5A52] disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Асуулт устгах"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>

                  <div className="relative" ref={insertMenuRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInsertMenuOpen((open) => !open);
                        setChoiceInsertMenuTargetId(null);
                        setIsTypeMenuOpen(false);
                      }}
                      className="transition hover:text-[#7E66DC]"
                      aria-label="Контент нэмэх"
                    >
                      <Plus className="h-6 w-6" />
                    </button>

                    {isInsertMenuOpen ? (
                      <div className="absolute left-0 top-10 z-20 w-[230px] overflow-hidden rounded-[18px] border border-[#E8E2F1] bg-white shadow-[0_14px_32px_rgba(35,23,73,0.12)]">
                        {insertMenuOptions.map((option) => {
                          const Icon = option.icon;

                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => showQuestionMediaInput(option.key)}
                              className={`flex w-full items-center gap-4 px-5 py-4 text-left text-[18px] text-[#111111] transition hover:bg-[#F8F6FF] ${
                                option.key === "pdf"
                                  ? "border-t border-[#EAE4F4]"
                                  : ""
                              }`}
                            >
                              <Icon className="h-6 w-6 text-[#6F687D]" />
                              <span>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>

                  <div className="relative min-w-[190px]" ref={typeMenuRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsTypeMenuOpen((open) => !open);
                        setIsInsertMenuOpen(false);
                        setChoiceInsertMenuTargetId(null);
                      }}
                      className="inline-flex h-[54px] w-full items-center gap-3 rounded-[16px] border border-[#E8E2F1] bg-white px-4 text-[18px] text-[#1A1623] outline-none transition hover:border-[#D6CFF3]"
                    >
                      <CircleDot className="h-5 w-5 text-[#6F687D]" />
                      <span>{getQuestionTypeLabel(activeQuestion.type)}</span>
                      <ChevronDown className="ml-auto h-5 w-5 text-[#6F687D]" />
                    </button>

                    {isTypeMenuOpen ? (
                      <div className="absolute left-0 top-[62px] z-20 w-[230px] overflow-hidden rounded-[18px] border border-[#E8E2F1] bg-white shadow-[0_14px_32px_rgba(35,23,73,0.12)]">
                        {typeOptions.map((option) => {
                          const Icon =
                            option.value === "mcq" ? CircleDot : AlignLeft;

                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                updateActiveQuestion((question) => ({
                                  ...question,
                                  type: option.value,
                                  choices:
                                    option.value === "mcq"
                                      ? normalizeQuestionChoices(
                                          question.choices.length >= 2
                                            ? question.choices
                                            : createDefaultMcqChoices(),
                                        )
                                      : question.choices,
                                }));
                                closeMenus();
                              }}
                              className="flex w-full items-center gap-4 px-5 py-4 text-left text-[18px] text-[#111111] transition hover:bg-[#F8F6FF]"
                            >
                              <Icon className="h-6 w-6 text-[#6F687D]" />
                              <span>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <input
                value={activeQuestion.question}
                onChange={(event) =>
                  updateActiveQuestion((question) => ({
                    ...question,
                    question: event.target.value,
                  }))
                }
                placeholder="Асуултаа бичнэ үү..."
                className="w-full border-0 border-b border-[#E8E2F1] bg-transparent px-0 pb-4 text-[18px] text-[#1A1623] outline-none placeholder:text-[#8E8A94]"
              />

              {activeQuestion.showImageInput || activeQuestion.showVideoInput ? (
                <div className="space-y-4">
                  {activeQuestion.showImageInput ? (
                    <div className="rounded-[20px] border border-[#E8E2F1] bg-[#FBFAFE] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-5 w-5 text-[#6F687D]" />
                          <p className="text-[17px] font-semibold text-[#1A1623]">
                            Асуултын зураг
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {activeQuestion.imageFileName ? (
                            <span className="max-w-[260px] truncate text-[13px] text-[#8E8A94]">
                              {activeQuestion.imageFileName}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => hideQuestionMediaInput("image")}
                            className="transition hover:text-[#DE5A52]"
                            aria-label="Асуултын зураг устгах"
                          >
                            <Trash2 className="h-5 w-5 text-[#6F687D]" />
                          </button>
                        </div>
                      </div>

                      <label className="mt-4 flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[18px] border border-dashed border-[#D9D0EE] bg-white transition hover:border-[#B59AF8]">
                        {activeQuestion.imageUrl ? (
                          <div className="flex h-[220px] w-full items-center justify-center overflow-hidden px-3 py-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={activeQuestion.imageUrl}
                              alt="Асуултын зураг"
                              className="h-full w-full rounded-[14px] object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 px-4 py-6 text-center text-[#8E8A94]">
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-[15px] font-medium">
                              Зураг сонгох
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            void handleQuestionAttachmentSelect(
                              activeQuestion.id,
                              "image",
                              event.target.files?.[0],
                            );
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                  ) : null}

                  {activeQuestion.showVideoInput ? (
                    <div className="rounded-[20px] border border-[#E8E2F1] bg-[#FBFAFE] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-[#6F687D]" />
                          <p className="text-[17px] font-semibold text-[#1A1623]">
                            Асуултын бичлэг
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {activeQuestion.videoFileName ? (
                            <span className="max-w-[260px] truncate text-[13px] text-[#8E8A94]">
                              {activeQuestion.videoFileName}
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => hideQuestionMediaInput("video")}
                            className="transition hover:text-[#DE5A52]"
                            aria-label="Асуултын бичлэг устгах"
                          >
                            <Trash2 className="h-5 w-5 text-[#6F687D]" />
                          </button>
                        </div>
                      </div>

                      <label className="mt-4 flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[18px] border border-dashed border-[#D9D0EE] bg-white px-4 py-6 transition hover:border-[#B59AF8]">
                        {activeQuestion.videoUrl ? (
                          <video
                            src={activeQuestion.videoUrl}
                            controls
                            className="max-h-[200px] w-full rounded-[14px] bg-[#0F0F10]"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-center text-[#8E8A94]">
                            <Video className="h-8 w-8" />
                            <span className="text-[15px] font-medium">
                              Бичлэг сонгох
                            </span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(event) => {
                            void handleQuestionAttachmentSelect(
                              activeQuestion.id,
                              "video",
                              event.target.files?.[0],
                            );
                            event.currentTarget.value = "";
                          }}
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeQuestion.type === "mcq" ? (
                <div className="space-y-4">
                  {normalizeQuestionChoices(activeQuestion.choices).map((choice) => {
                    const isChoiceMenuOpen = choiceInsertMenuTargetId === choice.id;
                    const isRemoveDisabled = activeQuestion.choices.length <= 2;

                    return (
                      <div key={choice.id} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              updateActiveQuestion((question) => ({
                                ...question,
                                choices: normalizeQuestionChoices(
                                  question.choices.map((item) => ({
                                    ...item,
                                    isCorrect: item.id === choice.id,
                                  })),
                                ),
                              }))
                            }
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-white transition ${
                              choice.isCorrect
                                ? "border-[#8F76F6]"
                                : "border-[#BAB4C5] hover:border-[#8F76F6]"
                            }`}
                            aria-label={`${choice.label} зөв хариулт болгох`}
                          >
                            {choice.isCorrect ? (
                              <span className="h-4 w-4 rounded-full bg-[#8F76F6]" />
                            ) : null}
                          </button>

                          <input
                            ref={(node) => {
                              choiceInputRefs.current[choice.id] = node;

                              if (
                                node &&
                                choiceIdToFocusRef.current === choice.id
                              ) {
                                node.focus();
                                choiceIdToFocusRef.current = null;
                              }
                            }}
                            value={choice.text}
                            onChange={(event) =>
                              updateActiveQuestion((question) => ({
                                ...question,
                                choices: normalizeQuestionChoices(
                                  question.choices.map((item) =>
                                    item.id === choice.id
                                      ? { ...item, text: event.target.value }
                                      : item,
                                  ),
                                ),
                              }))
                            }
                            placeholder={`${choice.label}. Хариулт`}
                            className="h-[56px] flex-1 rounded-[16px] border border-[#E8E2F1] bg-white px-4 text-[18px] text-[#1A1623] outline-none transition placeholder:text-[#8E8A94] focus:border-[#B59AF8] focus:ring-4 focus:ring-[#B59AF8]/15"
                          />

                          <div
                            className="relative"
                            ref={isChoiceMenuOpen ? choiceInsertMenuRef : null}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setChoiceInsertMenuTargetId((current) =>
                                  current === choice.id ? null : choice.id,
                                );
                                setIsInsertMenuOpen(false);
                                setIsTypeMenuOpen(false);
                              }}
                              className="transition hover:text-[#7E66DC]"
                              aria-label={`${choice.label} хариултад зураг эсвэл бичлэг нэмэх`}
                            >
                              <Plus className="h-6 w-6 text-[#6F687D]" />
                            </button>

                            {isChoiceMenuOpen ? (
                              <div className="absolute left-0 top-10 z-20 w-[230px] overflow-hidden rounded-[18px] border border-[#E8E2F1] bg-white shadow-[0_14px_32px_rgba(35,23,73,0.12)]">
                                {insertMenuOptions.map((option) => {
                                  const Icon = option.icon;

                                  return (
                                    <button
                                      key={`choice-${choice.id}-${option.key}`}
                                      type="button"
                                      onClick={() =>
                                        showChoiceMediaInput(choice.id, option.key)
                                      }
                                      className={`flex w-full items-center gap-4 px-5 py-4 text-left text-[18px] text-[#111111] transition hover:bg-[#F8F6FF] ${
                                        option.key === "pdf"
                                          ? "border-t border-[#EAE4F4]"
                                          : ""
                                      }`}
                                    >
                                      <Icon className="h-6 w-6 text-[#6F687D]" />
                                      <span>{option.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeChoice(choice.id)}
                            disabled={isRemoveDisabled}
                            className={`transition ${
                              isRemoveDisabled
                                ? "cursor-not-allowed opacity-45"
                                : "hover:text-[#DE5A52]"
                            }`}
                            aria-label={`${choice.label} хариулт устгах`}
                          >
                            <Trash2 className="h-6 w-6 text-[#6F687D]" />
                          </button>
                        </div>

                        {choice.showImageInput || choice.showVideoInput ? (
                          <div className="grid gap-3 pl-11 md:grid-cols-2">
                            {choice.showImageInput ? (
                              <div className="rounded-[18px] border border-[#E8E2F1] bg-[#FBFAFE] p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-[#6F687D]" />
                                    <span className="text-[15px] font-medium text-[#1A1623]">
                                      {choice.label}. Зураг
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {choice.imageFileName ? (
                                      <span className="max-w-[140px] truncate text-[12px] text-[#8E8A94]">
                                        {choice.imageFileName}
                                      </span>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        hideChoiceMediaInput(choice.id, "image")
                                      }
                                      className="transition hover:text-[#DE5A52]"
                                      aria-label={`${choice.label} хариултын зураг устгах`}
                                    >
                                      <Trash2 className="h-4 w-4 text-[#6F687D]" />
                                    </button>
                                  </div>
                                </div>

                                <label className="mt-3 flex min-h-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-[#D9D0EE] bg-white transition hover:border-[#B59AF8]">
                                  {choice.imageUrl ? (
                                    <div className="flex h-[120px] w-full items-center justify-center overflow-hidden px-2 py-2">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={choice.imageUrl}
                                        alt={`${choice.label} хариултын зураг`}
                                        className="h-full w-full rounded-[12px] object-contain"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 px-4 py-5 text-center text-[#8E8A94]">
                                      <ImageIcon className="h-6 w-6" />
                                      <span className="text-[13px]">
                                        Зураг сонгох
                                      </span>
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(event) => {
                                      void handleChoiceAttachmentSelect(
                                        activeQuestion.id,
                                        choice.id,
                                        "image",
                                        event.target.files?.[0],
                                      );
                                      event.currentTarget.value = "";
                                    }}
                                  />
                                </label>
                              </div>
                            ) : null}

                            {choice.showVideoInput ? (
                              <div className="rounded-[18px] border border-[#E8E2F1] bg-[#FBFAFE] p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <Video className="h-4 w-4 text-[#6F687D]" />
                                    <span className="text-[15px] font-medium text-[#1A1623]">
                                      {choice.label}. Бичлэг
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {choice.videoFileName ? (
                                      <span className="max-w-[140px] truncate text-[12px] text-[#8E8A94]">
                                        {choice.videoFileName}
                                      </span>
                                    ) : null}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        hideChoiceMediaInput(choice.id, "video")
                                      }
                                      className="transition hover:text-[#DE5A52]"
                                      aria-label={`${choice.label} хариултын бичлэг устгах`}
                                    >
                                      <Trash2 className="h-4 w-4 text-[#6F687D]" />
                                    </button>
                                  </div>
                                </div>

                                <label className="mt-3 flex min-h-[120px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-[#D9D0EE] bg-white px-4 py-5 transition hover:border-[#B59AF8]">
                                  {choice.videoUrl ? (
                                    <video
                                      src={choice.videoUrl}
                                      controls
                                      className="max-h-[96px] w-full rounded-[12px] bg-[#0F0F10]"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center gap-2 text-center text-[#8E8A94]">
                                      <Video className="h-6 w-6" />
                                      <span className="text-[13px]">
                                        Бичлэг сонгох
                                      </span>
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(event) => {
                                      void handleChoiceAttachmentSelect(
                                        activeQuestion.id,
                                        choice.id,
                                        "video",
                                        event.target.files?.[0],
                                      );
                                      event.currentTarget.value = "";
                                    }}
                                  />
                                </label>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 rounded-full border border-[#BAB4C5] bg-white" />
                    <button
                      type="button"
                      onClick={() => addChoice()}
                      className="flex h-[56px] flex-1 items-center rounded-[16px] border border-[#E8E2F1] bg-white px-4 text-left text-[18px] text-[#8E8A94] transition hover:border-[#D6CFF3]"
                    >
                      Хариулт нэмэх
                    </button>
                    <span className="w-6" />
                    <span className="w-6" />
                  </div>

                  <p className="text-[14px] text-[#6F687D]">
                    Зөв хариултын өмнөх тойргийг сонгоно уу
                  </p>
                </div>
              ) : (
                <div className="rounded-[16px] border border-dashed border-[#D9D0EE] bg-[#FBFAFE] px-4 py-5 text-[15px] text-[#6F687D]">
                  {activeQuestion.type === "open"
                    ? "Нээлттэй асуултад урьдчилсан сонголт шаардахгүй."
                    : "Богино хариултын асуултад сонголт оруулах шаардлагагүй."}
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-[18px] font-semibold text-[#111111]">
                  Оноо
                </label>
                <input
                  type="number"
                  min={1}
                  value={activeQuestion.points}
                  onChange={(event) =>
                    updateActiveQuestion((question) => ({
                      ...question,
                      points: Math.max(Number(event.target.value) || 1, 1),
                    }))
                  }
                  className={fieldClassName}
                />
              </div>

              {statusMessage ? (
                <p className="text-[14px] text-[#6F687D]">{statusMessage}</p>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/teacher/exams")}
                  className="text-[20px] font-medium text-[#111111] transition hover:text-[#7E66DC]"
                >
                  Цуцлах
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSavingQuestion}
                  className="inline-flex h-14 items-center justify-center rounded-[22px] bg-[#B7A3F7] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(126,102,220,0.28),0_12px_22px_rgba(183,163,247,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingQuestion ? "Хадгалж байна..." : "Хадгалах"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[#D9D0EE] bg-[#FBFAFE] px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#7E66DC] shadow-sm">
                <Plus className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-[22px] font-semibold text-[#1F1B27]">
                Асуулт алга байна
              </h2>
              <p className="mt-2 max-w-[420px] text-[15px] leading-7 text-[#6F687D]">
                Сүүлийн асуултыг устгасан байна. Шинэ асуулт нэмээд үргэлжлүүлнэ үү.
              </p>
              <button
                type="button"
                onClick={addQuestion}
                className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-[18px] bg-[#9E81F0] px-6 text-[16px] font-semibold text-white shadow-[inset_0_-4px_0_rgba(103,79,184,0.28),0_10px_18px_rgba(158,129,240,0.2)] transition hover:opacity-95"
              >
                <Plus className="h-5 w-5" />
                Асуулт нэмэх
              </button>
              {statusMessage ? (
                <p className="mt-4 text-[14px] text-[#6F687D]">{statusMessage}</p>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
