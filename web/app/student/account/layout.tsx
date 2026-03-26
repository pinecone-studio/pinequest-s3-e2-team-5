import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CloudflareStudentSync } from "@/components/auth/cloudflare-student-sync";
import { isUserRole } from "@/lib/auth-role";
import Header from "../_component/Header";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  const displayName =
    user?.firstName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress ??
    "Student";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const rawRole = user?.unsafeMetadata?.role;
  const rawFullName = user?.unsafeMetadata?.fullName;
  const rawPhone = user?.unsafeMetadata?.phone;
  const rawSchool = user?.unsafeMetadata?.school;
  const rawGrade = user?.unsafeMetadata?.grade;
  const rawClassName = user?.unsafeMetadata?.className;
  const rawInviteCode = user?.unsafeMetadata?.inviteCode;
  const role = isUserRole(rawRole) ? rawRole : "student";
  const fullName =
    typeof rawFullName === "string" && rawFullName.trim()
      ? rawFullName
      : displayName;
  const phone = typeof rawPhone === "string" ? rawPhone : "";
  const school = typeof rawSchool === "string" ? rawSchool : "";
  const grade = typeof rawGrade === "string" ? rawGrade : "";
  const className = typeof rawClassName === "string" ? rawClassName : "";
  const inviteCode = typeof rawInviteCode === "string" ? rawInviteCode : "";
  const hasStudentSyncMetadata = Boolean(
    fullName &&
      email &&
      school &&
      phone &&
      (grade || className) &&
      className &&
      inviteCode,
  );

  if (role !== "student") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC]">
      <Header />
      <div className="mx-auto max-w-[1245px] px-8 pt-4">
        {hasStudentSyncMetadata ? (
          <CloudflareStudentSync
            email={email}
            fullName={fullName}
            phone={phone}
            school={school}
            grade={grade}
            className={className}
            inviteCode={inviteCode}
            subject=""
            managerName=""
            address=""
            aimag=""
            role={role}
          />
        ) : null}
      </div>
      <main className="mx-auto max-w-[1245px] px-8 py-10">{children}</main>
    </div>
  );
}
