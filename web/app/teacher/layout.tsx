import type { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CloudflareStudentSync } from "@/components/auth/cloudflare-student-sync";
import { getRoleHomePath, isUserRole } from "@/lib/auth-role";
import { TeacherHeader } from "./_component/TeacherHeader";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.unsafeMetadata?.role;
  if (!isUserRole(role)) {
    redirect("/dashboard");
  }

  if (role !== "teacher") {
    redirect(getRoleHomePath(role));
  }

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const rawFullName = user.unsafeMetadata?.fullName;
  const rawPhone = user.unsafeMetadata?.phone;
  const rawSchool = user.unsafeMetadata?.school;
  const rawSubject = user.unsafeMetadata?.subject;
  const fullName =
    typeof rawFullName === "string" && rawFullName.trim()
      ? rawFullName
      : user.firstName ?? user.username ?? email;
  const phone = typeof rawPhone === "string" ? rawPhone : "";
  const school = typeof rawSchool === "string" ? rawSchool : "";
  const subject = typeof rawSubject === "string" ? rawSubject : "";

  return (
    <div className="min-h-screen bg-[#FCFCFE]">
      <div className="sr-only">
        <CloudflareStudentSync
          email={email}
          fullName={fullName}
          phone={phone}
          school={school}
          managerName=""
          address=""
          aimag=""
          grade=""
          className=""
          inviteCode=""
          subject={subject}
          role="teacher"
        />
      </div>
      <TeacherHeader />

      <main className="mx-auto w-full max-w-[1360px] px-6 py-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}
