import type { ReactNode } from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CloudflareStudentSync } from "@/components/auth/cloudflare-student-sync";
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

  // const role = user.unsafeMetadata?.role;
  // if (!isUserRole(role)) {
  //   redirect("/dashboard");
  // }

  // if (role !== "teacher") {
  //   redirect(getRoleHomePath(role));
  // }

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const rawFirstName = user.unsafeMetadata?.firstName;
  const rawLastName = user.unsafeMetadata?.lastName;
  const rawPhone = user.unsafeMetadata?.phone;
  const firstName =
    typeof rawFirstName === "string" && rawFirstName.trim()
      ? rawFirstName
      : user.firstName ?? user.username ?? email;
  const lastName =
    typeof rawLastName === "string" && rawLastName.trim() ? rawLastName : "";
  const phone = typeof rawPhone === "string" ? rawPhone : "";

  return (
    <div className="min-h-screen bg-[#FCFCFE]">
      <div className="sr-only">
        <CloudflareStudentSync
          email={email}
          firstName={firstName}
          lastName={lastName}
          phone={phone}
          grade=""
          className=""
          inviteCode=""
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
