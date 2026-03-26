"use client";

import { useMemo, useState } from "react";
import { TeacherExamCard } from "../_component/TeacherExamCard";
import { examCards, subjectTabs, type SubjectKey } from "../_data/dashboard";

export default function TeacherDashboardPage() {
  const [activeTab, setActiveTab] = useState<SubjectKey>("all");

  const filteredCards = useMemo(() => {
    if (activeTab === "all") {
      return examCards;
    }

    return examCards.filter((exam) => exam.subject === activeTab);
  }, [activeTab]);

  return (
    <section className="space-y-8">
      <div className="border-b border-[#E4E7F0]">
        <div className="flex flex-wrap items-end gap-8 text-[18px] font-semibold text-[#1B1A1F] lg:gap-10">
          {subjectTabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "border-b-2 pb-3 transition-colors",
                  isActive
                    ? "border-[#9A7BFF] text-[#9A7BFF]"
                    : "border-transparent text-[#25232A]",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {filteredCards.map((card) => (
          <TeacherExamCard
            key={card.id}
            card={card}
            href={`/teacher/dashboard/${card.id}`}
          />
        ))}
      </div>
    </section>
  );
}
