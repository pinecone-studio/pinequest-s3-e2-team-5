import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="New account"
      title="Create your PineQuest account"
      description="Clerk handles the sign-up flow here, then redirects new users straight into the dashboard route."
    >
      <SignUp />
    </AuthShell>
  );
}
