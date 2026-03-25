import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TeacherClassroomManager } from "@/components/teacher/teacher-classroom-manager";
import { TeacherSchoolRequest } from "@/components/teacher/teacher-school-request";
import { isUserRole } from "@/lib/auth-role";

export default async function TeacherPage() {
  const user = await currentUser();
  const rawRole = user?.unsafeMetadata?.role;
  const role = isUserRole(rawRole) ? rawRole : "student";

  if (role !== "teacher") {
    redirect("/dashboard");
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const fullName =
    typeof user?.unsafeMetadata?.fullName === "string"
      ? user.unsafeMetadata.fullName
      : user?.fullName ?? "";
  const phone =
    typeof user?.unsafeMetadata?.phone === "string"
      ? user.unsafeMetadata.phone
      : "";
  const subject =
    typeof user?.unsafeMetadata?.subject === "string"
      ? user.unsafeMetadata.subject
      : "";
  const school =
    typeof user?.unsafeMetadata?.school === "string"
      ? user.unsafeMetadata.school
      : "";

  return (
    <div className="space-y-6">
      <TeacherSchoolRequest
        email={email}
        fullName={fullName}
        phone={phone}
        subject={subject}
        initialSchool={school}
      />
      <TeacherClassroomManager />
    </div>
  );
}
