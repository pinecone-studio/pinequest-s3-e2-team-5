import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { ArrowRight, Fingerprint, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { CloudflareStudentSync } from "@/components/auth/cloudflare-student-sync";
import { SchoolTeacherApprovals } from "@/components/school/school-teacher-approvals";
import { Button } from "@/components/ui/button";
import { getRoleLabel, isUserRole } from "@/lib/auth-role";

const checks = [
  {
    icon: ShieldCheck,
    title: "Route protection",
    description: "This page is protected by Clerk in web/middleware.ts.",
  },
  {
    icon: Fingerprint,
    title: "Session context",
    description: "User data is available in the app router through Clerk's server helpers.",
  },
  {
    icon: Mail,
    title: "Redirect flow",
    description: "Sign-in and sign-up complete by landing the user back on this page.",
  },
] as const;

export default async function DashboardPage() {
  const user = await currentUser();
  const displayName =
    user?.firstName ??
    user?.username ??
    user?.primaryEmailAddress?.emailAddress ??
    "there";
  const email =
    user?.primaryEmailAddress?.emailAddress ?? "No primary email returned";
  const rawRole = user?.unsafeMetadata?.role;
  const rawFullName = user?.unsafeMetadata?.fullName;
  const rawManagerName = user?.unsafeMetadata?.managerName;
  const rawPhone = user?.unsafeMetadata?.phone;
  const rawSchool = user?.unsafeMetadata?.school;
  const rawAddress = user?.unsafeMetadata?.address;
  const rawAimag = user?.unsafeMetadata?.aimag;
  const rawGrade = user?.unsafeMetadata?.grade;
  const rawClassName = user?.unsafeMetadata?.className;
  const rawInviteCode = user?.unsafeMetadata?.inviteCode;
  const rawSubject = user?.unsafeMetadata?.subject;
  const role = isUserRole(rawRole) ? rawRole : "student";
  const fullName =
    typeof rawFullName === "string" && rawFullName.trim()
      ? rawFullName
      : displayName;
  const phone = typeof rawPhone === "string" ? rawPhone : "";
  const school = typeof rawSchool === "string" ? rawSchool : "";
  const managerName = typeof rawManagerName === "string" ? rawManagerName : "";
  const address = typeof rawAddress === "string" ? rawAddress : "";
  const aimag = typeof rawAimag === "string" ? rawAimag : "";
  const grade = typeof rawGrade === "string" ? rawGrade : "";
  const className = typeof rawClassName === "string" ? rawClassName : "";
  const inviteCode = typeof rawInviteCode === "string" ? rawInviteCode : "";
  const subject = typeof rawSubject === "string" ? rawSubject : "";
  const roleLabel = getRoleLabel(role);
  const roleDescription =
    role === "school"
      ? "Your school manager account is ready for approving teachers and managing school-level settings."
      : role === "teacher"
      ? "Your teacher account is ready for managing learners, creating assessments, and reviewing outcomes."
      : "Your student account is ready for joining classes, taking exams, and following your progress.";

  return (
    <main className="relative flex flex-1 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.08),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(120,113,108,0.12),_transparent_30%)]" />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-14">
        <div className="space-y-4">
          <p className="text-sm font-medium tracking-[0.22em] text-muted-foreground uppercase">
            {roleLabel} dashboard
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Welcome back, {displayName}.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            {roleDescription}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-4 md:grid-cols-3">
            {checks.map((check) => {
              const Icon = check.icon;

              return (
                <article
                  key={check.title}
                  className="rounded-3xl border border-border/70 bg-card/90 p-6 shadow-sm backdrop-blur"
                >
                  <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-muted text-foreground">
                    <Icon className="size-5" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {check.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {check.description}
                  </p>
                </article>
              );
            })}
          </div>

          <aside className="rounded-[2rem] border border-border/70 bg-foreground p-6 text-background shadow-lg">
            <p className="text-sm font-medium tracking-[0.22em] text-background/70 uppercase">
              Active user
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {displayName}
            </p>
            <p className="mt-2 inline-flex w-fit rounded-full border border-background/20 px-3 py-1 text-xs font-medium tracking-[0.18em] text-background/80 uppercase">
              {roleLabel}
            </p>
            <p className="mt-2 break-all text-sm leading-7 text-background/80">
              {email}
            </p>
            <div className="mt-3">
              <UserButton />
            </div>
            <CloudflareStudentSync
              email={email}
              fullName={fullName}
              phone={phone}
              school={school}
              grade={grade}
              className={className}
              inviteCode={inviteCode}
              subject={subject}
              managerName={managerName}
              address={address}
              aimag={aimag}
              role={role}
            />
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="mt-8 bg-background text-foreground hover:bg-background/90"
            >
              <Link href="/">
                Back to home
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </aside>
        </div>

        {role === "school" ? <SchoolTeacherApprovals /> : null}
      </section>
    </main>
  );
}
