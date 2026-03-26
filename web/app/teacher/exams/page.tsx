"use client";

import { Plus } from "lucide-react";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TeacherExamCard } from "../_component/TeacherExamCard";
import { examCards, subjectTabs, type SubjectKey } from "../_data/dashboard";

// shadcn dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
<<<<<<< Updated upstream
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
=======
>>>>>>> Stashed changes

interface ExamData {
  createExam: {
    id: string;
    title: string;
  };
}

const CREATE_EXAM = gql`
  mutation CreateExam($input: createExamInput!) {
    createExam(input: $input) {
      id
      title
    }
  }
<<<<<<< Updated upstream
`

export default function TeacherDashboardPage() {
=======
`;

export default function TeacherExamsPage() {
>>>>>>> Stashed changes
  const [activeTab, setActiveTab] = useState<SubjectKey>("all");

  const router = useRouter();

  const filteredCards = useMemo(() => {
    if (activeTab === "all") {
      return examCards;
    }

    return examCards.filter((exam) => exam.subject === activeTab);
  }, [activeTab]);

<<<<<<< Updated upstream
  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")

  const [duration, setDuration] = useState(60)
  const [grade, setGrade] = useState("")

  const [createExam, { error, 
    // loading 
  }] = useMutation<ExamData>(CREATE_EXAM)

=======
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [grade, setGrade] = useState("");
  const [createExam] = useMutation<ExamData>(CREATE_EXAM);
>>>>>>> Stashed changes

  const handleCreateExam = async () => {
    const res = await createExam({
      variables: {
        input: {
          title,
          subject,
          description,
          duration,
          grade,
        },
      },
    });

    const examId = res.data?.createExam.id;

    if (examId) {
      router.push(`/teacher/exams/${examId}/edit`);
    }
  };

  return (
    <section className="space-y-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-[38px] font-semibold tracking-tight text-[#17131F]">
            Шалгалтууд
          </h1>
          <p className="mt-1 text-[16px] font-medium text-[#787482]">
            Хичээлийн шалгалтууд
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button className="inline-flex h-14 items-center gap-3 rounded-[22px] bg-[#9E81F0] px-8 text-[18px] font-semibold text-white shadow-[inset_0_-5px_0_rgba(103,79,184,0.38),0_12px_22px_rgba(158,129,240,0.28)] transition hover:translate-y-[-1px] hover:opacity-95">
              <Plus className="h-6 w-6" />
              Шинэ шалгалт
            </button>
          </DialogTrigger>

          <DialogContent className="rounded-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                Үндсэн мэдээлэл
              </DialogTitle>
            </DialogHeader>

            {/* Form */}
            <div className="space-y-4">
              {/* Хичээл */}
              <div>
                <label className="text-sm font-medium">Хичээл</label>
                <input className="mt-1 w-full rounded-lg border p-3 text-sm"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Хичээл сонгох"
                />
              </div>

              {/* Сэдэв */}
              <div>
                <label className="text-sm font-medium">Сэдвийн нэр</label>
                <input
                  placeholder="Жишээ: Алгебр Тест-1"
                  className="mt-1 w-full rounded-lg border p-3 text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium">Тодорхойлолт</label>
                <input
                  placeholder="Тодорхойлолт"
                  className="mt-1 w-full rounded-lg border p-3 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              {/* Анги */}
              <div>
                <label className="text-sm font-medium">Анги</label>
                <input
                  className="mt-1 w-full rounded-lg border p-3 text-sm"
                  placeholder="Анги сонгох"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                />
              </div>

              {/* Хугацаа */}
              <div>
                <label className="text-sm font-medium">Хугацаа(минут)</label>
                <input
                  className="mt-1 w-full rounded-lg border p-3 text-sm"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <button className="px-4 py-2 text-sm">Буцах</button>
              <button className="rounded-full bg-[#9A7BFF] px-5 py-2 text-sm font-semibold text-white"
                onClick={handleCreateExam}>
                Үргэлжлүүлэх
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border-b border-[#E4E7F0]">
        <div className="flex flex-wrap items-end gap-8 text-[18px] font-semibold lg:gap-10">
          {subjectTabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 pb-3 transition-colors ${
                  isActive
                    ? "border-[#9A7BFF] text-[#9A7BFF]"
                    : "border-transparent text-[#25232A]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-4">
        {filteredCards.map((card) => (
          <TeacherExamCard
            key={card.id}
            card={card}
            href={`/teacher/exams/${card.id}`}
            showActionButton
          />
        ))}
      </div>
    </section>
  );
}
