import type { ReactNode } from "react";
import { TeacherHeader } from "./_component/TeacherHeader";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FCFCFE]">
      <TeacherHeader />
      <main className="mx-auto w-full max-w-[1128px]">{children}</main>
    </div>
  );
}
