"use client";

import { CircleHelp, Clock3, FileText, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  examCards,
  getSubjectCardPalette,
  subjectTabs,
  type SubjectKey,
} from "../_data/dashboard";

// shadcn dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";

interface ExamData {
  createExam: {
    id: string
    title: string
  }
}

const CREATE_EXAM = gql`
  mutation CreateExam($input: createExamInput!){
      createExam(input: $input){
          id
          title
      }
  }
`

export default function TeacherDashboardPage() {
  const [activeTab, setActiveTab] = useState<SubjectKey>("all");

  const router = useRouter()

  const filteredCards = useMemo(() => {
    if (activeTab === "all") return examCards;
    return examCards.filter((exam) => exam.subject === activeTab);
  }, [activeTab]);

  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")

  const [duration, setDuration] = useState(60)
  const [grade, setGrade] = useState("")

  const [createExam, { error, 
    // loading 
  }] = useMutation<ExamData>(CREATE_EXAM)


  const handleCreateExam = async () => {

    const res = await createExam({
      variables: {
        input: {
          title,
          subject,
          description,
          duration,
          grade
        }
      }
    })

    const examId = res.data?.createExam.id

    console.log(error)

    router.push(`/teacher/exams/${examId}/edit`)

  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1B1A1F]">Шалгалтууд</h1>
          <p className="text-sm text-[#8C8A94]">Хичээлийн шалгалтууд</p>
        </div>

        {/* Dialog Trigger */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 rounded-full bg-[#9A7BFF] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8A6AF0]">
              + Шинэ шалгалт
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg rounded-2xl">
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

      {/* Tabs */}
      <div className="border-b border-[#E4E7F0]">
        <div className="flex flex-wrap items-end gap-8 text-[18px] font-semibold lg:gap-10">
          {subjectTabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`border-b-2 pb-3 transition-colors ${isActive
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

      {/* Cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {filteredCards.map((card) => {
          const palette = getSubjectCardPalette(card.subject);
          const SubjectIcon = card.subject === "social" ? FileText : Users;

          return (
            <Link
              key={card.id}
              href={`/teacher/dashboard/${card.id}`}
              className="group block rounded-2xl border px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-md"
              style={{
                backgroundColor: palette.cardBackground,
                borderColor: palette.borderColor,
              }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="rounded-xl p-2"
                  style={{ backgroundColor: palette.iconBackground }}
                >
                  <SubjectIcon className="h-5 w-5 text-[#111111]" />
                </div>

              </div>

              <div className="mt-4">
                <h2 className="text-[18px] font-semibold text-[#111]">
                  {card.title}
                  <span className="font-normal"> /{card.topic}/</span>
                </h2>
                <p className="text-sm text-[#6B6B6B]">{card.grade}</p>
              </div>

              <div className="mt-5 flex gap-2 text-xs">
                <span className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 shadow-sm">
                  <Clock3 className="h-3.5 w-3.5" /> {card.duration} мин
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 shadow-sm">
                  <CircleHelp className="h-3.5 w-3.5" /> {card.taskCount} даалгавар
                </span>
              </div>

              <p className="mt-4 text-sm text-[#111111]">
                Эхлэх хугацаа-/{card.startTime}/
              </p>
              <p className="mt-3 text-xs text-[#6D6778]">{card.date}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
