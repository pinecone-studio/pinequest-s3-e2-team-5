import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.unsafeMetadata?.role;

  if (role === "student") {
    redirect("/student/account");
  }

  if (role === "teacher") {
    redirect("/teacher");
  }

  redirect("/");
}
