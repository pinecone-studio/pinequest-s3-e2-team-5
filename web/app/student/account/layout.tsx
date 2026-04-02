import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isUserRole } from "@/lib/auth-role";
import { StudentAccountShell } from "../_component/StudentAccountShell";

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
  const rawFirstName = user?.unsafeMetadata?.firstName;
  const rawLastName = user?.unsafeMetadata?.lastName;
  const rawPhone = user?.unsafeMetadata?.phone;
  const rawGrade = user?.unsafeMetadata?.grade;
  const rawClassName = user?.unsafeMetadata?.className;
  const rawInviteCode = user?.unsafeMetadata?.inviteCode;
  const role = isUserRole(rawRole) ? rawRole : "student";
  const firstName =
    typeof rawFirstName === "string" && rawFirstName.trim()
      ? rawFirstName
      : user?.firstName ?? displayName;
  const lastName =
    typeof rawLastName === "string" && rawLastName.trim() ? rawLastName : "";
  const phone = typeof rawPhone === "string" ? rawPhone : "";
  const grade = typeof rawGrade === "string" ? rawGrade : "";
  const className = typeof rawClassName === "string" ? rawClassName : "";
  const inviteCode = typeof rawInviteCode === "string" ? rawInviteCode : "";
  const hasStudentSyncMetadata = Boolean(
    firstName && email && phone && inviteCode,
  );

  if (role !== "student") {
    redirect("/dashboard");
  }

  return (
    <StudentAccountShell
      hasStudentSyncMetadata={hasStudentSyncMetadata}
      syncProps={{
        email,
        firstName,
        lastName,
        phone,
        grade,
        className,
        inviteCode,
        role,
      }}
    >
      {children}
    </StudentAccountShell>
  );
}
