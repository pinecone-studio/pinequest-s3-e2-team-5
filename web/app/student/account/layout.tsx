import { redirect } from "next/navigation";
import { StudentAccountShell } from "../_component/StudentAccountShell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentAccountShell
    >
      {children}
    </StudentAccountShell>
  );
}
