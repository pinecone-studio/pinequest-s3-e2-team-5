export type SubjectKey = "all" | "social" | "civics";

export type ExamCard = {
  id: string;
  title: string;
  grade: string;
  date: string;
  duration: number;
  taskCount: number;
  subject: Exclude<SubjectKey, "all">;
};

export type StudentResult = {
  id: number;
  name: string;
  section: string;
  score: string;
  submittedAt: string;
};

export const subjectTabs: { key: SubjectKey; label: string }[] = [
  { key: "all", label: "Бүгд" },
  { key: "social", label: "Нийгэм" },
  { key: "civics", label: "Иргэний боловсрол" },
];

export const examCards: ExamCard[] = [
  {
    id: "soc-10-a",
    title: "Нийгэм",
    grade: "10-р анги",
    date: "03.25.2026",
    duration: 60,
    taskCount: 30,
    subject: "social",
  },
  {
    id: "soc-10-b",
    title: "Нийгэм",
    grade: "9-р анги",
    date: "03.25.2026",
    duration: 60,
    taskCount: 30,
    subject: "social",
  },
  {
    id: "soc-10-c",
    title: "Нийгэм",
    grade: "11-р анги",
    date: "03.25.2026",
    duration: 60,
    taskCount: 30,
    subject: "social",
  },
  {
    id: "soc-10-d",
    title: "Нийгэм",
    grade: "12-р анги",
    date: "03.25.2026",
    duration: 60,
    taskCount: 30,
    subject: "social",
  },
  {
    id: "civ-9-a",
    title: "Иргэний боловсрол",
    grade: "9-р анги",
    date: "03.28.2026",
    duration: 45,
    taskCount: 24,
    subject: "civics",
  },
  {
    id: "civ-11-a",
    title: "Иргэний боловсрол",
    grade: "11-р анги",
    date: "04.01.2026",
    duration: 50,
    taskCount: 28,
    subject: "civics",
  },
];

export const studentResultsByExam: Record<string, StudentResult[]> = {
  "soc-10-a": [
    { id: 1, name: "Самбуудорж Ануужин", section: "10-1", score: "23/30", submittedAt: "2/8/2025" },
    { id: 2, name: "Ц.Номуунаа", section: "10-1", score: "23/30", submittedAt: "2/8/2025" },
    { id: 3, name: "Б.Тэмүүлэн", section: "10-2", score: "21/30", submittedAt: "2/8/2025" },
    { id: 4, name: "Г.Мишээл", section: "10-2", score: "26/30", submittedAt: "2/8/2025" },
    { id: 5, name: "Э.Сондор", section: "10-3", score: "20/30", submittedAt: "2/8/2025" },
    { id: 6, name: "М.Марал", section: "10-1", score: "28/30", submittedAt: "2/8/2025" },
    { id: 7, name: "Ж.Номин", section: "10-3", score: "24/30", submittedAt: "2/8/2025" },
  ],
  "soc-10-b": [
    { id: 1, name: "Д.Анударь", section: "9-1", score: "25/30", submittedAt: "2/9/2025" },
    { id: 2, name: "Н.Төгөлдөр", section: "9-1", score: "19/30", submittedAt: "2/9/2025" },
    { id: 3, name: "О.Ивээл", section: "9-2", score: "27/30", submittedAt: "2/9/2025" },
  ],
  "soc-10-c": [
    { id: 1, name: "А.Саруул", section: "11-1", score: "24/30", submittedAt: "2/10/2025" },
    { id: 2, name: "Ч.Амин", section: "11-2", score: "22/30", submittedAt: "2/10/2025" },
  ],
  "soc-10-d": [
    { id: 1, name: "П.Мөнхжин", section: "12-1", score: "18/30", submittedAt: "2/11/2025" },
    { id: 2, name: "С.Мөнгөнзул", section: "12-2", score: "29/30", submittedAt: "2/11/2025" },
  ],
  "civ-9-a": [
    { id: 1, name: "Ц.Эрхэс", section: "9-3", score: "20/24", submittedAt: "3/1/2025" },
  ],
  "civ-11-a": [
    { id: 1, name: "Э.Наран", section: "11-3", score: "25/28", submittedAt: "3/3/2025" },
  ],
};
