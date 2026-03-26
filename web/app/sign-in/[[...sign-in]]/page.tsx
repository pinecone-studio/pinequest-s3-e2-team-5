"use client";

import { useAuth, useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

function getErrorMessages(errors: unknown) {
  if (!Array.isArray(errors)) {
    return [];
  }

  return errors.map((error) => {
    if (
      typeof error === "object" &&
      error !== null &&
      "longMessage" in error &&
      typeof error.longMessage === "string"
    ) {
      return error.longMessage;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }

    return "Something went wrong. Please try again.";
  });
}

const inputClassName =
  "h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/25 focus:ring-2 focus:ring-ring/30";

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/auth/after-sign-in");
    }
  }, [isSignedIn, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");

    const { error } = await signIn.password({
      emailAddress,
      password,
    });

    if (error) {
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          const url = decorateUrl("/auth/after-sign-in");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
      return;
    }

    setStatusMessage(
      "This account needs an extra verification step. We can add MFA handling next if you use it.",
    );
  };

  const errorMessages = getErrorMessages(errors);
  const isSubmitting = fetchStatus === "fetching";

  if (isSignedIn) {
    return null;
  }

  return (
    <AuthShell
      eyebrow="Custom authentication"
      title="Sign in to PineQuest"
      description="This screen is fully yours now. Clerk is only handling the session in the background."
    >
      <form className="space-y-5 p-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium tracking-tight text-foreground"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            placeholder="you@example.com"
            value={emailAddress}
            onChange={(event) => setEmailAddress(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="text-sm font-medium tracking-tight text-foreground"
            >
              Password
            </label>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={inputClassName}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {errorMessages.length > 0 ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        ) : null}

        {statusMessage ? (
          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            {statusMessage}
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full rounded-xl"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-foreground/80"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
