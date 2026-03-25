import type { ReactNode } from "react";
import { TeacherHeader } from "./_component/TeacherHeader";

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F8FB]">
      <TeacherHeader />

      <main className="mx-auto w-full max-w-[1512px] px-6 py-8">
        {children}
      </main>
    </div>
  );
}
