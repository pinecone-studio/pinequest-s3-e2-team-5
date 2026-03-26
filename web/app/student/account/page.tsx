"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  BookA,
  CheckCheck,
  Clock3,
  FlaskConical,
  Info,
  NotebookText,
  PenLine,
  Radical,
} from "lucide-react";
import {
  completedExamStorageKey,
  formatStudentExamDate,
  mergeCompletedExams,
  type CompletedExamRecord,
  type StudentExamIconKey,
} from "../_data/completed-exams";
import ExamCard from "../_component/ExamCard";

type Exam = {
  id: string;
  subject: string;
  topic: string;
  description: string;
  grade: string;
  minutes: number;
  exercises: number;
  date: string;
  bg: string;
  iconBg: string;
  iconKey: StudentExamIconKey;
  icon: ReactNode;
};

type ExamQuestion = {
  id: string;
  order: number;
  prompt: string;
  scoreLabel: string;
  description?: string;
  options?: {
    id: string;
    label: string;
    text: string;
  }[];
};

const questionPalette = Array.from({ length: 20 }, (_, index) => index + 1);

const additionalQuestionPrompts = [
  "Иргэний үндсэн эрхийн нэг аль вэ?",
  "Төрийн гурван өндөрлөгт аль нь багтдаг вэ?",
  "Үндсэн хууль ямар үүрэгтэй вэ?",
  "Нийгмийн бүлгийн жишээ аль вэ?",
  "Сонгуулийн гол зорилго юу вэ?",
  "Хариуцлагатай иргэн гэж хэнийг хэлэх вэ?",
  "Орон нутгийн өөрөө удирдах байгууллага аль вэ?",
  "Хууль зөрчвөл ямар үр дагавартай вэ?",
  "Ардчилалд хэвлэл мэдээлэл ямар үүрэгтэй вэ?",
  "Татварын үндсэн зориулалт юу вэ?",
  "Хүний эрхийг хамгаалах байгууллага аль вэ?",
  "Нийгмийн шударга ёс гэж юу вэ?",
  "Улсын бэлгэдэлд аль нь хамаарах вэ?",
  "Боловсролын гол ач холбогдол юу вэ?",
  "Иргэний үүргийн жишээ аль вэ?",
  "Төр ба иргэний харилцааны үндэс юу вэ?",
  "Хуулийн өмнө хүн бүр ямар байх ёстой вэ?",
] as const;

const optionTemplates = [
  [
    { id: "a", label: "A.", text: "Хувийн сонирхлыг дээдлэх" },
    { id: "b", label: "Б.", text: "Хуулиар олгогдсон боломж" },
    { id: "c", label: "В.", text: "Бусдыг үл хүндэтгэх" },
    { id: "d", label: "Г.", text: "Дүрэм зөрчих эрх" },
  ],
  [
    { id: "a", label: "A.", text: "Иргэдийн дуу хоолойг тусгах" },
    { id: "b", label: "Б.", text: "Нууцаар шийдвэр гаргах" },
    { id: "c", label: "В.", text: "Хувийн ашиг сонирхлыг түрүүлэх" },
    { id: "d", label: "Г.", text: "Хариуцлагаас зайлсхийх" },
  ],
  [
    { id: "a", label: "A.", text: "Нийгмийн дэг журмыг хамгаалах" },
    { id: "b", label: "Б.", text: "Зөвхөн шийтгэл өгөх" },
    { id: "c", label: "В.", text: "Маргаан үүсгэх" },
    { id: "d", label: "Г.", text: "Хяналтгүй орхих" },
  ],
  [
    { id: "a", label: "A.", text: "Хамтын амьдралыг зохион байгуулах" },
    { id: "b", label: "Б.", text: "Хүчээр захирах" },
    { id: "c", label: "В.", text: "Мэдээллийг нуух" },
    { id: "d", label: "Г.", text: "Эрхийг хязгаарлах" },
  ],
];

const examQuestions: ExamQuestion[] = [
  {
    id: "q1",
    order: 1,
    prompt: "Нийгэм гэж юу вэ?",
    scoreLabel: "1/1 оноо",
    description:
      "Нийгэм гэдэг нь хүмүүс хоорондоо хамтран амьдарч, харилцаж, дүрэм журам, үнэт зүйл, байгууллага, соёлын хүрээнд зохион байгуулалттай оршиж буй хамтын амьдралын тогтолцоо юм.",
  },
  {
    id: "q2",
    order: 2,
    prompt: "Ардчиллын гол зарчим аль нь вэ?",
    scoreLabel: "0/1 оноо",
    options: [
      { id: "a", label: "A.", text: "Нэг хүний засаглал" },
      { id: "b", label: "Б.", text: "Иргэдийн оролцоо" },
      { id: "c", label: "В.", text: "Хүчээр захирах" },
      { id: "d", label: "Г.", text: "Хаант засаглал" },
    ],
  },
  {
    id: "q3",
    order: 3,
    prompt: "Хууль ямар үүрэгтэй вэ?",
    scoreLabel: "0/1 оноо",
    options: [
      { id: "a", label: "A.", text: "Зөвхөн шийтгэх" },
      { id: "b", label: "Б.", text: "Нийгмийг задлах" },
      { id: "c", label: "В.", text: "Харилцааг зохицуулах" },
      { id: "d", label: "Г.", text: "Зөвхөн төрд үйлчлэх" },
    ],
  },
  ...additionalQuestionPrompts.map((prompt, index) => ({
    id: `q${index + 4}`,
    order: index + 4,
    prompt,
    scoreLabel: "0/1 оноо",
    options: optionTemplates[index % optionTemplates.length],
  })),
];

const initialAnswers: Record<string, string> = {};

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getExamHeaderTitle(exam: Exam) {
  if (exam.id === "social-studies") {
    return "Нийгмийн ухаан - Шалгалт";
  }

  return `${exam.subject} - Шалгалт`;
}

const exams: Exam[] = [
  {
    id: "social-studies",
    icon: (
      <NotebookText size={24} strokeWidth={2.2} className="text-[#18181B]" />
    ),
    subject: "Нийгэм",
    topic: "Соёл",
    description: "Нийгмийн ухааны суурь мэдлэг шалгах шалгалт",
    grade: "10-р анги",
    minutes: 60,
    exercises: 30,
    date: "03/25, 2026",
    bg: "bg-[#E8E4F8]",
    iconBg: "bg-[#D4CEFE]",
    iconKey: "notebookText",
  },
  {
    id: "math",
    icon: <Radical size={24} strokeWidth={2.2} className="text-[#18181B]" />,
    subject: "Математик",
    topic: "Алгебр",
    description: "Алгебрийн бодлого бодох чадвар шалгах шалгалт",
    grade: "10-р анги",
    minutes: 60,
    exercises: 30,
    date: "03/25, 2026",
    bg: "bg-[#DFF0F8]",
    iconBg: "bg-[#C8E4F4]",
    iconKey: "radical",
  },
  {
    id: "chemistry",
    icon: (
      <FlaskConical size={24} strokeWidth={2.2} className="text-[#18181B]" />
    ),
    subject: "Хими",
    topic: "Молекул",
    description: "Химийн үндсэн ойлголт, молекулын бүтэц шалгах шалгалт",
    grade: "10-р анги",
    minutes: 60,
    exercises: 30,
    date: "03/25, 2026",
    bg: "bg-[#F0E4F8]",
    iconBg: "bg-[#E0CEFE]",
    iconKey: "flaskConical",
  },
  {
    id: "english",
    icon: <BookA size={24} strokeWidth={2.2} className="text-[#18181B]" />,
    subject: "Англи",
    topic: "Speaking",
    description: "Англи хэлний унших, ойлгох суурь чадвар шалгах шалгалт",
    grade: "10-р анги",
    minutes: 60,
    exercises: 30,
    date: "03/25, 2026",
    bg: "bg-[#F2F6D8]",
    iconBg: "bg-[#E4EEB8]",
    iconKey: "bookA",
  },
];

export default function ShalgaltuudPage() {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [startedExam, setStartedExam] = useState<Exam | null>(null);
  const [submittedExamName, setSubmittedExamName] = useState<string | null>(
    null,
  );
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [focusedQuestion, setFocusedQuestion] = useState(1);
  const [answers, setAnswers] =
    useState<Record<string, string>>(initialAnswers);

  useEffect(() => {
    if (!startedExam) {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [startedExam]);

  const handleFocusQuestion = (order: number) => {
    setFocusedQuestion(order);

    const questionElement = document.getElementById(`question-${order}`);
    questionElement?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSelectAnswer = (
    questionId: string,
    optionId: string,
    order: number,
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionId,
    }));
    setFocusedQuestion(order);
  };

  const handleStartExam = () => {
    if (!selectedExam) {
      return;
    }

    setSubmittedExamName(null);
    setStartedExam(selectedExam);
    setSecondsLeft(Math.max(selectedExam.minutes * 60 - 14, 0));
    setFocusedQuestion(1);
    setAnswers(initialAnswers);
  };

  const saveCompletedExam = (exam: Exam) => {
    const completedExam: CompletedExamRecord = {
      id: exam.id,
      iconKey: exam.iconKey,
      subject: exam.subject,
      topic: exam.topic,
      grade: exam.grade,
      minutes: exam.minutes,
      exercises: exam.exercises,
      date: formatStudentExamDate(),
      bg: exam.bg,
      iconBg: exam.iconBg,
    };

    try {
      const stored = window.localStorage.getItem(completedExamStorageKey);
      const parsed = stored
        ? (JSON.parse(stored) as CompletedExamRecord[])
        : [];
      const next = mergeCompletedExams([completedExam, ...parsed]);
      window.localStorage.setItem(
        completedExamStorageKey,
        JSON.stringify(next),
      );
    } catch {
      window.localStorage.setItem(
        completedExamStorageKey,
        JSON.stringify([completedExam]),
      );
    }
  };

  const handleSubmitExam = () => {
    if (!startedExam) {
      return;
    }

    saveCompletedExam(startedExam);
    setSubmittedExamName(getExamHeaderTitle(startedExam));
    setStartedExam(null);
    setSelectedExam(null);
    setSecondsLeft(0);
    setFocusedQuestion(1);
  };

  if (startedExam) {
    return (
      <section className="relative left-1/2 -mt-10 min-h-[calc(100vh-72px)] w-screen -translate-x-1/2 bg-[#FCFCFF]">
        <div className="border-b border-[#ECE8F6] bg-white">
          <div className="mx-auto flex h-[72px] w-full max-w-[1245px] items-center justify-between px-8">
            <p className="text-[18px] font-semibold tracking-tight text-[#161616]">
              {getExamHeaderTitle(startedExam)}
            </p>

            <div className="inline-flex items-center gap-2 rounded-[16px] bg-[#F6F1FF] px-4 py-2 text-[16px] font-medium text-[#38324A]">
              <Clock3 className="h-5 w-5" strokeWidth={2.1} />
              <span>{formatTime(secondsLeft)}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1245px] gap-5 px-8 py-8 lg:grid-cols-[208px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[18px] border border-[#E6E1F2] bg-white p-3 shadow-[0_4px_12px_rgba(53,31,107,0.03)]">
            <p className="mb-4 text-[14px] font-semibold text-[#2A2733]">
              Асуулт
            </p>

            <div className="mx-auto grid w-fit grid-cols-5 gap-2.5">
              {questionPalette.map((order) => {
                const isFocused = focusedQuestion === order;
                const question = examQuestions.find(
                  (currentQuestion) => currentQuestion.order === order,
                );
                const isAnswered = Boolean(question && answers[question.id]);

                return (
                  <button
                    key={order}
                    type="button"
                    onClick={() => handleFocusQuestion(order)}
                    className={[
                      "flex h-7 w-7 cursor-pointer items-center justify-center rounded-[10px] border text-[12px] font-medium transition",
                      isAnswered
                        ? "border-[#9D86EA] bg-[#EEE8FF] text-[#7E66DC]"
                        : isFocused
                          ? "border-[#D9D1F2] bg-[#FAFAFF] text-[#2F2A3B]"
                          : "border-[#9D86EA] bg-white text-[#7E66DC]",
                    ].join(" ")}
                  >
                    {order}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="space-y-6">
            {examQuestions.map((question) => (
              <article
                key={question.id}
                id={`question-${question.order}`}
                className="rounded-[16px] border border-[#E8E4F3] bg-white p-4 shadow-[0_4px_12px_rgba(53,31,107,0.03)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-[16px] font-semibold text-[#27242F]">
                    {question.order}. {question.prompt}
                  </h2>
                  <span className="shrink-0 text-[14px] font-medium text-[#5E5A68]">
                    {question.scoreLabel}
                  </span>
                </div>

                {question.description ? (
                  <div className="mt-4 rounded-[12px] border border-[#E9E4F6] bg-[#FFFEFF] px-4 py-3 text-[15px] leading-7 text-[#5C5964]">
                    {question.description}
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {question.options?.map((option) => {
                      const isSelected = answers[question.id] === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            handleSelectAnswer(
                              question.id,
                              option.id,
                              question.order,
                            )
                          }
                          className={[
                            "flex w-full items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition",
                            isSelected
                              ? "border-[#DCD5FA] bg-[#F2EEFF]"
                              : "border-[#EAE6F5] bg-white hover:border-[#DCD5FA]",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              isSelected
                                ? "border-[#8C73E2]"
                                : "border-[#C8C3D8]",
                            ].join(" ")}
                          >
                            {isSelected ? (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#8C73E2]" />
                            ) : null}
                          </span>
                          <span className="text-[15px] font-medium text-[#383540]">
                            {option.label} {option.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </article>
            ))}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSubmitExam}
                className="flex h-[48px] min-w-[180px] items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,#9D86EA_0%,#8E74E0_100%)] px-8 text-[16px] font-semibold text-white shadow-[inset_0_-8px_0_rgba(95,74,171,0.20),0_10px_18px_rgba(144,118,226,0.20)] transition hover:brightness-[1.02]"
              >
                Шалгалт илгээх
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (submittedExamName) {
    return (
      <section className="animate-in fade-in slide-in-from-bottom-2 flex justify-center pt-12 duration-300">
        <div className="w-full max-w-[936px] rounded-[24px] border border-[#DCD7FF] bg-[#F8F6FF] px-10 py-6 shadow-[0_10px_24px_rgba(124,99,230,0.05)]">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EEE9FF] text-[#8B74E2]">
              <CheckCheck className="h-5 w-5" strokeWidth={2.2} />
            </div>

            <div>
              <h2 className="text-[24px] font-semibold tracking-tight text-[#222126]">
                Шалгалт амжилттай илгээгдлээ
              </h2>
              <p className=" text-[17px] text-[#9A98A6]">
                Үр дүнг хугацаа дууссаны дараа харах боломжтой
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (selectedExam) {
    return (
      <section className="animate-in fade-in slide-in-from-bottom-2 flex min-h-[calc(100vh-152px)] w-full items-center justify-center duration-300">
        <div className="flex w-full max-w-[744px] max-h-[338px] flex-col gap-8 rounded-[32px] border border-[#DCD9FF] bg-[#F9F8FF] px-[26px] pt-[30px] pb-[30px]">
          <div className="flex flex-col gap-7">
            <div className="w-full">
              <h1 className="text-[24px] leading-[1.05] font-semibold tracking-[-0.03em] text-[#111111]">
                {selectedExam.subject}
              </h1>

              <p className="mt-3 text-[16px] font-normal text-[#8B8B8B]">
                {selectedExam.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="inline-flex h-[28px] items-center gap-3 rounded-full bg-[#FAFAF8] px-6 text-[14px] leading-none font-medium text-[#111111]">
                <Clock3 className="h-[18px] w-[18px]" strokeWidth={2.1} />
                <span>{selectedExam.minutes} мин</span>
              </div>

              <div className="inline-flex h-[28px] items-center gap-3 rounded-full bg-[#FAFAF8] px-6 text-[14px] leading-none font-medium text-[#111111]">
                <PenLine className="h-[18px] w-[18px]" strokeWidth={2.1} />
                <span>{selectedExam.exercises} дасгал</span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-[12px] border border-[#DCDAF5] bg-[#F2F1FF] px-[8px] py-[10px]">
            <div className="flex items-start gap-2">
              <Info
                className="mt-0.5 h-5 w-5 shrink-0 text-[#141414]"
                strokeWidth={2.1}
              />
              <p className="max-w-[590px] text-[14px] leading-[1.35] font-normal text-[#141414]">
                Шалгалтыг эхлүүлсэн тохиолдолд хугацаа зогсохгүй үргэлжлэн
                тоологдож, дуусмагц автоматаар илгээгдэхийг анхаарна уу.
              </p>
            </div>
          </div>

          <div className="mt-auto">
            <div className="flex w-full items-center justify-end gap-[18px]">
              <button
                type="button"
                onClick={() => setSelectedExam(null)}
                className="text-[16px] leading-none font-medium text-[#111111] transition hover:text-[#7C63E6] cursor-pointer"
              >
                Буцах
              </button>

              <button
                type="button"
                onClick={handleStartExam}
                className="cursor-pointer flex h-[44px] min-w-[144px] items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#9D86EA_0%,#8E74E0_100%)] px-10 text-[16px] leading-none font-semibold text-white shadow-[inset_0_-8px_0_rgba(95,74,171,0.22),0_8px_18px_rgba(144,118,226,0.22)] transition hover:brightness-[1.02]"
              >
                Эхлэх
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[24px] font-bold text-gray-900">
          Боломжтой шалгалтууд
        </h1>
        <p className="mt-1 text-[14px] text-[#5B5B5B]">
          Одоогоор идэвхтэй байгаа шалгалтуудаа өгнө үү.
        </p>
      </div>

      <div className="mx-auto grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(264px,264px))]">
        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            {...exam}
            onClick={() => setSelectedExam(exam)}
          />
        ))}
      </div>
    </div>
  );
}
