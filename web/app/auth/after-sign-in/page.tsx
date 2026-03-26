import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getRoleHomePath, isUserRole } from "@/lib/auth-role";

export default async function AfterSignInPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const role = user.unsafeMetadata?.role;
  if (!isUserRole(role)) {
    redirect("/dashboard");
  }

  redirect(getRoleHomePath(role));
}
