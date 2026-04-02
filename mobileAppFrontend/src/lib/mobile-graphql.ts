import type { Exam, Submission, StudentProfile } from "@/data/types";

type MobileRemoteConfig = {
  graphqlUrl: string;
  accessKey: string;
  studentEmail: string;
  studentInviteCode?: string;
};

let runtimeStudentInviteCode: string | null = null;

type GraphqlError = {
  message?: string;
};

type GraphqlResponse<TData> = {
  data?: TData;
  errors?: GraphqlError[];
};

type RemoteStudentProfile = {
  studentById: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    grade: string;
    className: string;
    inviteCode: string;
  };
};

type RemoteAvailableExams = {
  availableExamsForStudent: {
    id: string;
    examId: string;
    title: string;
    subject: string;
    description: string | null;
    grade: string;
    scheduledDate: string | null;
    startTime: string | null;
    duration: number;
    questionCount: number;
  }[];
};

type RemoteExamDetail = {
  studentExamDetail: {
    id: string;
    title: string;
    subject: string;
    description: string | null;
    grade: string;
    scheduledDate: string | null;
    startTime: string | null;
    duration: number;
    questionCount: number;
    questions: {
      id: string;
      type: "mcq";
      question: string;
      order: number;
      choices: {
        id: string;
        label: string;
        text: string;
      }[];
    }[];
  };
};

type RemoteSubmissionSummaries = {
  myExamSubmissions: {
    id: string;
    examId: string;
    title: string;
    subject: string;
    grade: string;
    scheduledDate: string | null;
    startTime: string | null;
    duration: number;
    questionCount: number;
    correctAnswers: number;
    scorePercent: number;
    submittedAt: number;
  }[];
};

type RemoteScheduledExams = {
  scheduledExamsForStudent: {
    id: string;
    examId: string;
    title: string;
    subject: string;
    description: string | null;
    grade: string;
    scheduledDate: string | null;
    startTime: string | null;
    duration: number;
    questionCount: number;
  }[];
};

type RemoteSubmissionDetail = {
  studentExamSubmissionDetail: {
    id: string;
    examId: string;
    title: string;
    subject: string;
    grade: string;
    scheduledDate: string | null;
    startTime: string | null;
    duration: number;
    questionCount: number;
    correctAnswers: number;
    scorePercent: number;
    submittedAt: number;
    answers: {
      questionId: string;
      order: number;
      question: string;
      type: "mcq";
      answerText: string | null;
      correctAnswerText: string | null;
      aiExplanation: string | null;
      selectedChoiceId: string | null;
      correctChoiceId: string | null;
      isCorrect: boolean | null;
      choices: {
        id: string;
        label: string;
        text: string;
      }[];
    }[];
  };
};

type SubmitStudentExamResponse = {
  submitStudentExam: {
    id: string;
  };
};

type ChangeStudentClassroomResponse = {
  changeStudentClassroom: RemoteStudentProfile["studentById"];
};

const GET_CURRENT_STUDENT = `
  query GetCurrentStudentProfile {
    studentById {
      id
      firstName
      lastName
      email
      phone
      grade
      className
      inviteCode
    }
  }
`;

const GET_AVAILABLE_EXAMS = `
  query GetAvailableExamsForStudent {
    availableExamsForStudent {
      id
      examId
      title
      subject
      description
      grade
      scheduledDate
      startTime
      duration
      questionCount
    }
  }
`;

const GET_STUDENT_EXAM_DETAIL = `
  query GetStudentExamDetail($examId: String!) {
    studentExamDetail(examId: $examId) {
      id
      title
      subject
      description
      grade
      scheduledDate
      startTime
      duration
      questionCount
      questions {
        id
        type
        question
        order
        choices {
          id
          label
          text
        }
      }
    }
  }
`;

const GET_MY_EXAM_SUBMISSIONS = `
  query GetMyExamSubmissions {
    myExamSubmissions {
      id
      examId
      title
      subject
      grade
      scheduledDate
      startTime
      duration
      questionCount
      correctAnswers
      scorePercent
      submittedAt
    }
  }
`;

const GET_SCHEDULED_EXAMS = `
  query GetScheduledExamsForStudent {
    scheduledExamsForStudent {
      id
      examId
      title
      subject
      description
      grade
      scheduledDate
      startTime
      duration
      questionCount
    }
  }
`;

const GET_STUDENT_EXAM_SUBMISSION_DETAIL = `
  query GetStudentExamSubmissionDetail($submissionId: String!) {
    studentExamSubmissionDetail(submissionId: $submissionId) {
      id
      examId
      title
      subject
      grade
      scheduledDate
      startTime
      duration
      questionCount
      correctAnswers
      scorePercent
      submittedAt
      answers {
        questionId
        order
        question
        type
        answerText
        correctAnswerText
        aiExplanation
        selectedChoiceId
        correctChoiceId
        isCorrect
        choices {
          id
          label
          text
        }
      }
    }
  }
`;

const SUBMIT_STUDENT_EXAM = `
  mutation SubmitStudentExam($input: SubmitStudentExamInput!) {
    submitStudentExam(input: $input) {
      id
    }
  }
`;

const CHANGE_STUDENT_CLASSROOM = `
  mutation ChangeStudentClassroom($input: ChangeStudentClassroomInput!) {
    changeStudentClassroom(input: $input) {
      id
      firstName
      lastName
      email
      phone
      grade
      className
      inviteCode
    }
  }
`;

const NETWORK_TIMEOUT_MS = 8_000;

function readEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function setMobileStudentInviteCode(inviteCode?: string | null) {
  const normalizedInviteCode = inviteCode?.trim().toUpperCase() ?? "";
  runtimeStudentInviteCode = normalizedInviteCode || null;
}

export function getMobileRemoteConfig(): MobileRemoteConfig | null {
  const graphqlUrl = readEnv("EXPO_PUBLIC_GRAPHQL_URL");
  const accessKey = readEnv("EXPO_PUBLIC_MOBILE_DEMO_ACCESS_KEY");
  const studentEmail = readEnv("EXPO_PUBLIC_MOBILE_STUDENT_EMAIL").toLowerCase();
  const studentInviteCode =
    runtimeStudentInviteCode ?? readEnv("EXPO_PUBLIC_MOBILE_STUDENT_INVITE_CODE").toUpperCase();

  if (!graphqlUrl || !accessKey || !studentEmail) {
    return null;
  }

  return {
    graphqlUrl,
    accessKey,
    studentEmail,
    studentInviteCode: studentInviteCode || undefined,
  };
}

async function fetchGraphql<TData>(query: string, variables?: Record<string, unknown>) {
  const config = getMobileRemoteConfig();

  if (!config) {
    throw new Error("Mobile GraphQL тохиргоо дутуу байна.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, NETWORK_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(config.graphqlUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mobile-demo-key": config.accessKey,
        "x-mobile-student-email": config.studentEmail,
        ...(config.studentInviteCode
          ? { "x-mobile-student-invite-code": config.studentInviteCode }
          : {}),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      signal: controller.signal,
    });
  } catch (caughtError) {
    if (caughtError instanceof Error && caughtError.name === "AbortError") {
      throw new Error("Сервертэй холбогдох хугацаа хэтэрлээ. Backend ажиллаж байгаа эсэхийг шалгана уу.");
    }

    throw new Error("Сервертэй холбогдож чадсангүй. Backend болон утас нэг сүлжээнд байгаа эсэхийг шалгана уу.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`GraphQL хүсэлт ${response.status} кодтой уналаа.`);
  }

  const payload = (await response.json()) as GraphqlResponse<TData>;
  const errorMessage = payload.errors?.find((error) => error.message)?.message;

  if (errorMessage) {
    throw new Error(errorMessage);
  }

  if (!payload.data) {
    throw new Error("GraphQL өгөгдөл буцаасангүй.");
  }

  return payload.data;
}

function mapStudentProfile(payload: RemoteStudentProfile["studentById"]): StudentProfile {
  return {
    id: payload.id,
    fullName: [payload.lastName, payload.firstName].filter(Boolean).join(" "),
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    role: "student",
    phone: payload.phone,
    grade: payload.grade,
    className: payload.className,
    inviteCode: payload.inviteCode,
  };
}

function mapAvailableExamSummary(
  payload: RemoteAvailableExams["availableExamsForStudent"][number],
): Exam {
  return {
    id: payload.id,
    title: payload.title,
    subject: payload.subject,
    description: payload.description ?? "",
    grade: payload.grade,
    duration: payload.duration,
    scheduledDate: payload.scheduledDate ?? "",
    startTime: payload.startTime ?? "",
    questionCount: payload.questionCount,
    questions: [],
  };
}

function mapExam(payload: RemoteExamDetail["studentExamDetail"]): Exam {
  return {
    id: payload.id,
    title: payload.title,
    subject: payload.subject,
    description: payload.description ?? "",
    grade: payload.grade,
    duration: payload.duration,
    scheduledDate: payload.scheduledDate ?? "",
    startTime: payload.startTime ?? "",
    questionCount: payload.questionCount,
    questions: payload.questions.map((question) => ({
      id: question.id,
      type: "mcq",
      question: question.question,
      order: question.order,
      choices: question.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        text: choice.text,
        isCorrect: false,
      })),
    })),
  };
}

function mapSubmissionSummary(
  payload: RemoteSubmissionSummaries["myExamSubmissions"][number],
): Submission {
  return {
    id: payload.id,
    examId: payload.examId,
    title: payload.title,
    subject: payload.subject,
    grade: payload.grade,
    scheduledDate: payload.scheduledDate,
    startTime: payload.startTime,
    duration: payload.duration,
    questionCount: payload.questionCount,
    correctAnswers: payload.correctAnswers,
    scorePercent: payload.scorePercent,
    submittedAt: payload.submittedAt,
    answers: [],
  };
}

function mapSubmission(payload: RemoteSubmissionDetail["studentExamSubmissionDetail"]): Submission {
  return {
    id: payload.id,
    examId: payload.examId,
    title: payload.title,
    subject: payload.subject,
    grade: payload.grade,
    duration: payload.duration,
    questionCount: payload.questionCount,
    correctAnswers: payload.correctAnswers,
    scorePercent: payload.scorePercent,
    submittedAt: payload.submittedAt,
    scheduledDate: payload.scheduledDate,
    startTime: payload.startTime,
    answers: payload.answers.map((answer) => ({
      questionId: answer.questionId,
      order: answer.order,
      question: answer.question,
      type: "mcq",
      answerText: answer.answerText,
      correctAnswerText: answer.correctAnswerText,
      aiExplanation: answer.aiExplanation,
      selectedChoiceId: answer.selectedChoiceId,
      correctChoiceId: answer.correctChoiceId,
      isCorrect: answer.isCorrect,
      choices: answer.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        text: choice.text,
      })),
    })),
  };
}

export async function fetchRemoteStudentProfile() {
  const payload = await fetchGraphql<RemoteStudentProfile>(GET_CURRENT_STUDENT);
  return mapStudentProfile(payload.studentById);
}

export async function fetchRemoteAvailableExams() {
  const payload = await fetchGraphql<RemoteAvailableExams>(GET_AVAILABLE_EXAMS);
  return payload.availableExamsForStudent.map(mapAvailableExamSummary);
}

export async function fetchRemoteScheduledExams() {
  const payload = await fetchGraphql<RemoteScheduledExams>(GET_SCHEDULED_EXAMS);
  return payload.scheduledExamsForStudent.map(mapAvailableExamSummary);
}

export async function fetchRemoteExamById(examId: string) {
  const payload = await fetchGraphql<RemoteExamDetail>(GET_STUDENT_EXAM_DETAIL, { examId });
  return mapExam(payload.studentExamDetail);
}

export async function fetchRemoteSubmissions() {
  const payload = await fetchGraphql<RemoteSubmissionSummaries>(GET_MY_EXAM_SUBMISSIONS);
  return payload.myExamSubmissions.map(mapSubmissionSummary);
}

export async function fetchRemoteSubmissionById(submissionId: string) {
  const payload = await fetchGraphql<RemoteSubmissionDetail>(GET_STUDENT_EXAM_SUBMISSION_DETAIL, {
    submissionId,
  });
  return mapSubmission(payload.studentExamSubmissionDetail);
}

export async function submitRemoteStudentExam(input: {
  examId: string;
  startedAt: number;
  answers: { questionId: string; selectedChoiceId: string | null; answerText: string | null }[];
}) {
  const payload = await fetchGraphql<SubmitStudentExamResponse>(SUBMIT_STUDENT_EXAM, { input });
  return payload.submitStudentExam;
}

export async function changeRemoteStudentClassroom(inviteCode: string) {
  const payload = await fetchGraphql<ChangeStudentClassroomResponse>(CHANGE_STUDENT_CLASSROOM, {
    input: {
      inviteCode: inviteCode.trim().toUpperCase(),
    },
  });

  return mapStudentProfile(payload.changeStudentClassroom);
}
