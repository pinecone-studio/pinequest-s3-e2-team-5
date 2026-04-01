import type { Exam, StudentProfile, Submission } from "@/data/types";

export const studentProfile: StudentProfile = {
  id: "student-demo-001",
  fullName: "Б. Тэмүүлэн",
  firstName: "Тэмүүлэн",
  lastName: "Б",
  email: "temuulen@school.mn",
  role: "student",
  phone: "99112233",
  grade: "9",
  className: "9А - Туршилтын анги",
  inviteCode: "9A-101",
};

export const examCatalog: Exam[] = [
  {
    id: "math-001",
    title: "Квадрат тэгшитгэл",
    subject: "math",
    description: "9-р ангийн суурь сэдвээр бэлтгэсэн богино шалгалт.",
    grade: "9-р анги",
    duration: 20,
    scheduledDate: "2026-03-31",
    startTime: "09:00",
    questionCount: 3,
    questions: [
      {
        id: "math-q1",
        type: "mcq",
        order: 1,
        question: "x² = 49 тэгшитгэлийн шийд аль нь вэ?",
        choices: [
          { id: "math-q1-a", label: "A", text: "x = 7", isCorrect: false },
          { id: "math-q1-b", label: "B", text: "x = ±7", isCorrect: true },
          { id: "math-q1-c", label: "C", text: "x = 14", isCorrect: false },
          { id: "math-q1-d", label: "D", text: "x = 0", isCorrect: false },
        ],
      },
      {
        id: "math-q2",
        type: "mcq",
        order: 2,
        question: "x² + 5x + 6 = 0 тэгшитгэлийн язгуурууд?",
        choices: [
          { id: "math-q2-a", label: "A", text: "1 ба 6", isCorrect: false },
          { id: "math-q2-b", label: "B", text: "-2 ба -3", isCorrect: true },
          { id: "math-q2-c", label: "C", text: "2 ба 3", isCorrect: false },
          { id: "math-q2-d", label: "D", text: "-1 ба -6", isCorrect: false },
        ],
      },
      {
        id: "math-q3",
        type: "mcq",
        order: 3,
        question: "Дискриминант D < 0 бол юу үнэн бэ?",
        choices: [
          { id: "math-q3-a", label: "A", text: "2 бодит язгууртай", isCorrect: false },
          { id: "math-q3-b", label: "B", text: "1 давхар язгууртай", isCorrect: false },
          { id: "math-q3-c", label: "C", text: "Бодит язгуургүй", isCorrect: true },
          { id: "math-q3-d", label: "D", text: "Ямагт эерэг байна", isCorrect: false },
        ],
      },
    ],
  },
  {
    id: "english-001",
    title: "Уншлага ба дүрэм",
    subject: "english",
    description: "Англи хэлний богино шалгалт.",
    grade: "10-р анги",
    duration: 15,
    scheduledDate: "2026-03-31",
    startTime: "14:30",
    questionCount: 3,
    questions: [
      {
        id: "eng-q1",
        type: "mcq",
        order: 1,
        question: "Зөв бичигдсэн өгүүлбэрийг сонго.",
        choices: [
          { id: "eng-q1-a", label: "A", text: "Би өчигдөр сургууль явсан.", isCorrect: true },
          { id: "eng-q1-b", label: "B", text: "Би өчигдөр сургууль явла.", isCorrect: false },
          { id: "eng-q1-c", label: "C", text: "Би өчигдөр сургууль явасан.", isCorrect: false },
          { id: "eng-q1-d", label: "D", text: "Би өчигдөр сургуул явсан.", isCorrect: false },
        ],
      },
      {
        id: "eng-q2",
        type: "mcq",
        order: 2,
        question: "'Хурдан' үгийн ойролцоо утгатай үгийг сонго.",
        choices: [
          { id: "eng-q2-a", label: "A", text: "Удаан", isCorrect: false },
          { id: "eng-q2-b", label: "B", text: "Шуурхай", isCorrect: true },
          { id: "eng-q2-c", label: "C", text: "Хожуу", isCorrect: false },
          { id: "eng-q2-d", label: "D", text: "Нам гүм", isCorrect: false },
        ],
      },
      {
        id: "eng-q3",
        type: "mcq",
        order: 3,
        question: "Сургуулийн хуваарийн аппад хамгийн тохирох гарчгийг сонго.",
        choices: [
          { id: "eng-q3-a", label: "A", text: "Миний хуваарь", isCorrect: true },
          { id: "eng-q3-b", label: "B", text: "Хурдан идье", isCorrect: false },
          { id: "eng-q3-c", label: "C", text: "Удаан гүйе", isCorrect: false },
          { id: "eng-q3-d", label: "D", text: "Өндөр барилга", isCorrect: false },
        ],
      },
    ],
  },
];

export const seedSubmissions: Submission[] = [];
