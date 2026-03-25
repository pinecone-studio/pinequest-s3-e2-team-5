import type { ReactNode } from "react";
import { TeacherHeader } from "./_component/TeacherHeader";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FCFCFE]">
      <TeacherHeader />

      <main className="mx-auto w-full max-w-[1360px] px-6 py-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}
