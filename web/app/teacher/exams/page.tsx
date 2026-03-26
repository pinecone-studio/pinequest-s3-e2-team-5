"use client";

import { CircleHelp, Clock3, FileText, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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

function StatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
        Нийтлэгдсэн
      </span>
    );
  }

  if (status === "closed") {
    return (
      <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
        Хаагдсан
      </span>
    );
  }

  return (
    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-600">
      Ноорог
    </span>
  );
}

export default function TeacherDashboardPage() {
  const [activeTab, setActiveTab] = useState<SubjectKey>("all");

  const filteredCards = useMemo(() => {
    if (activeTab === "all") return examCards;
    return examCards.filter((exam) => exam.subject === activeTab);
  }, [activeTab]);

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
                <select className="mt-1 w-full rounded-lg border p-3 text-sm">
                  <option>Хичээл сонгох</option>
                </select>
              </div>

              {/* Сэдэв */}
              <div>
                <label className="text-sm font-medium">Сэдвийн нэр</label>
                <input
                  placeholder="Жишээ: Алгебр Тест-1"
                  className="mt-1 w-full rounded-lg border p-3 text-sm"
                />
              </div>

              {/* Анги */}
              <div>
                <label className="text-sm font-medium">Анги</label>
                <select className="mt-1 w-full rounded-lg border p-3 text-sm">
                  <option>Анги сонгох</option>
                </select>
              </div>

              {/* Бүлэг */}
              <div>
                <label className="text-sm font-medium">Бүлэг</label>
                <select className="mt-1 w-full rounded-lg border p-3 text-sm">
                  <option>Бүлэг сонгох</option>
                </select>
              </div>

              {/* Хугацаа */}
              <div>
                <label className="text-sm font-medium">Хугацаа(минут)</label>
                <input
                  defaultValue={60}
                  className="mt-1 w-full rounded-lg border p-3 text-sm"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <button className="px-4 py-2 text-sm">Буцах</button>
              <button className="rounded-full bg-[#9A7BFF] px-5 py-2 text-sm font-semibold text-white">
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

      {/* Cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {filteredCards.map((card) => (
          <Link
            key={card.id}
            href={`/teacher/dashboard/${card.id}`}
            className="group block rounded-2xl border border-[#E6E1F5] bg-[#F7F3FF] px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-md hover:border-[#D6C8FF]"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-xl bg-[#EEE6FF] p-2">
                {card.type === "test" ? (
                  <FileText className="h-5 w-5 text-[#7C5CFF]" />
                ) : (
                  <Users className="h-5 w-5 text-[#5B8DEF]" />
                )}
              </div>

              <StatusBadge status={card.status} />
            </div>

            <div className="mt-4">
              <h2 className="text-[18px] font-semibold text-[#111]">
                {card.title}
              </h2>
              <p className="text-sm text-[#6B6B6B]">{card.grade}</p>
            </div>

            <div className="mt-5 flex gap-2 text-xs">
              <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                <Clock3 className="h-3.5 w-3.5" /> {card.duration} мин
              </span>
              <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 shadow-sm">
                <CircleHelp className="h-3.5 w-3.5" /> {card.taskCount} даалгавар
              </span>
            </div>

            <p className="mt-4 text-xs text-[#9A98A3]">{card.date}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
