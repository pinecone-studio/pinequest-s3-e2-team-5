export type Choice = {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
};

export type Question = {
  id: string;
  type: "mcq";
  question: string;
  order: number;
  choices: Choice[];
};

export type Exam = {
  id: string;
  title: string;
  subject: string;
  description: string;
  grade: string;
  duration: number;
  scheduledDate: string;
  startTime: string;
  questionCount: number;
  questions: Question[];
};

export type SubmissionAnswer = {
  questionId: string;
  order: number;
  question: string;
  type: "mcq";
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

export type Submission = {
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
  answers: SubmissionAnswer[];
};

export type StudentProfile = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "student";
  phone: string;
  grade: string;
  className: string;
  inviteCode: string;
};
