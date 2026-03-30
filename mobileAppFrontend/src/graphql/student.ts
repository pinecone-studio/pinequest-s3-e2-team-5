import { gql } from "@apollo/client";

export type AvailableExam = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  grade: string;
  duration: number;
  questionCount: number;
  scheduledDate: string | null;
  startTime: string | null;
};

export type StudentExamQuestion = {
  id: string;
  type: "mcq" | "open" | "short";
  question: string;
  order: number;
  choices: {
    id: string;
    label: string;
    text: string;
  }[];
};

export type StudentAnswerDraft = {
  selectedChoiceId?: string;
  answerText?: string;
};

export type AvailableExamsData = {
  availableExamsForStudent: AvailableExam[];
};

export type StudentExamDetailData = {
  studentExamDetail: AvailableExam & {
    questions: StudentExamQuestion[];
  };
};

export type MyExamSubmissionsData = {
  myExamSubmissions: {
    id: string;
    examId: string;
    title: string;
    subject: string;
    grade: string;
    duration: number;
    questionCount: number;
    correctAnswers: number;
    scorePercent: number;
    submittedAt: number;
  }[];
};

export type SubmissionAnswerReview = {
  questionId: string;
  order: number;
  question: string;
  type: "mcq" | "open" | "short";
  answerText: string | null;
  selectedChoiceId: string | null;
  correctChoiceId: string | null;
  isCorrect: boolean | null;
  choices: {
    id: string;
    label: string;
    text: string;
  }[];
};

export type StudentExamSubmissionDetailData = {
  studentExamSubmissionDetail: {
    id: string;
    examId: string;
    title: string;
    subject: string;
    grade: string;
    duration: number;
    questionCount: number;
    correctAnswers: number;
    scorePercent: number;
    submittedAt: number;
    scheduledDate: string | null;
    startTime: string | null;
    answers: SubmissionAnswerReview[];
  };
};

export type SubmitStudentExamData = {
  submitStudentExam: {
    id: string;
  };
};

export const GET_AVAILABLE_EXAMS = gql`
  query GetAvailableExamsForStudent {
    availableExamsForStudent {
      id
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

export const GET_STUDENT_EXAM_DETAIL = gql`
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

export const GET_MY_EXAM_SUBMISSIONS = gql`
  query GetMyExamSubmissions {
    myExamSubmissions {
      id
      examId
      title
      subject
      grade
      duration
      questionCount
      correctAnswers
      scorePercent
      submittedAt
    }
  }
`;

export const GET_STUDENT_EXAM_SUBMISSION_DETAIL = gql`
  query GetStudentExamSubmissionDetail($submissionId: String!) {
    studentExamSubmissionDetail(submissionId: $submissionId) {
      id
      examId
      title
      subject
      grade
      duration
      questionCount
      correctAnswers
      scorePercent
      submittedAt
      scheduledDate
      startTime
      answers {
        questionId
        order
        question
        type
        answerText
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

export const SUBMIT_STUDENT_EXAM = gql`
  mutation SubmitStudentExam($input: SubmitStudentExamInput!) {
    submitStudentExam(input: $input) {
      id
    }
  }
`;
