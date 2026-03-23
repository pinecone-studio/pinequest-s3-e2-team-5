import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Authentication"
      title="Sign in to PineQuest"
      description="Use the auth methods enabled in your Clerk dashboard to continue into the protected app experience."
    >
      <SignIn />
    </AuthShell>
  );
}
