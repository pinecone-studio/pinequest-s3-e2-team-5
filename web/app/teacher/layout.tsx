import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CloudflareStudentSync } from "@/components/auth/cloudflare-student-sync";
import { isUserRole } from "@/lib/auth-role";
import { TeacherHeader } from "./_component/TeacherHeader";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await currentUser();
  const displayName =
    user?.firstName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress ??
    "Teacher";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const rawRole = user?.unsafeMetadata?.role;
  const rawFirstName = user?.unsafeMetadata?.firstName;
  const rawLastName = user?.unsafeMetadata?.lastName;
  const rawPhone = user?.unsafeMetadata?.phone;
  const role = isUserRole(rawRole) ? rawRole : "teacher";
  const firstName =
    typeof rawFirstName === "string" && rawFirstName.trim()
      ? rawFirstName
      : user?.firstName ?? displayName;
  const lastName =
    typeof rawLastName === "string" && rawLastName.trim() ? rawLastName : "";
  const phone = typeof rawPhone === "string" ? rawPhone : "";
  const hasTeacherSyncMetadata = Boolean(firstName && email && phone);

  if (role !== "teacher") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#FCFCFE]">
      <TeacherHeader />

      <div className="mx-auto w-full max-w-[1360px] px-6 pt-4 lg:px-8">
        {hasTeacherSyncMetadata ? (
          <CloudflareStudentSync
            email={email}
            firstName={firstName}
            lastName={lastName}
            phone={phone}
            grade=""
            className=""
            inviteCode=""
            role={role}
          />
        ) : null}
      </div>

      <main className="mx-auto w-full max-w-[1360px] px-6 py-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}
