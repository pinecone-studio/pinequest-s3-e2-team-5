"use client";

import { useAuth, useSignUp, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  getRoleHomePath,
  getRoleLabel,
  isUserRole,
  roleOptions,
  type UserRole,
} from "@/lib/auth-role";

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

const mongoliaAimags = [
  "Arkhangai",
  "Bayan-Olgii",
  "Bayankhongor",
  "Bulgan",
  "Darkhan-Uul",
  "Dornod",
  "Dornogovi",
  "Dundgovi",
  "Govi-Altai",
  "Govisumber",
  "Khentii",
  "Khovd",
  "Khuvsgul",
  "Orkhon",
  "Ovorkhangai",
  "Omnogovi",
  "Selenge",
  "Sukhbaatar",
  "Tov",
  "Uvs",
  "Zavkhan",
] as const;

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("student");
  const [fullName, setFullName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [address, setAddress] = useState("");
  const [aimag, setAimag] = useState<(typeof mongoliaAimags)[number]>(
    mongoliaAimags[0],
  );
  const [inviteCode, setInviteCode] = useState("");
  const [subject, setSubject] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      router.replace(role === "student" ? "/student/account" : "/dashboard");
    }

    router.replace(getRoleHomePath(role));
  }, [isSignedIn, isUserLoaded, role, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = phone.trim();
    const metadata = {
      role,
      fullName: role === "school" ? undefined : fullName.trim(),
      managerName: role === "school" ? managerName.trim() : undefined,
      phone: role === "school" ? undefined : normalizedPhone || "",
      school: role === "student" ? undefined : school.trim(),
      address: role === "school" ? address.trim() : undefined,
      aimag: role === "school" ? aimag : undefined,
      inviteCode: role === "student" ? inviteCode.trim().toUpperCase() : undefined,
      subject: role === "teacher" ? subject.trim() : undefined,
    };

    const { error } = await signUp.password({
      emailAddress,
      password,
      unsafeMetadata: metadata,
    });

    if (error) {
      return;
    }

    const sendCodeResult = await signUp.verifications.sendEmailCode();
    if (!sendCodeResult.error) {
      setPendingVerification(true);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { error } = await signUp.verifications.verifyEmailCode({
      code,
    });

    if (error) {
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          if (role === "student") {
            router.push("/student/account");
            return;
          }

          const url = decorateUrl("/dashboard");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
    }
  };

  const errorMessages = getErrorMessages(errors);
  const isSubmitting = fetchStatus === "fetching";

  if (isSignedIn) {
    return null;
  }

  return (
    <AuthShell
      eyebrow="Custom registration"
      title="Create your PineQuest account"
      description="This is a custom sign-up flow with your own inputs and verification step."
    >
      {pendingVerification ? (
        <form className="space-y-5 p-4" onSubmit={handleVerify}>
          <div className="rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            We sent a verification code to{" "}
            <span className="font-medium text-foreground">{emailAddress}</span>{" "}
            for your{" "}
            <span className="font-medium text-foreground">
              {getRoleLabel(role)}
            </span>{" "}
            account.
          </div>

          <div className="space-y-2">
            <label
              htmlFor="code"
              className="text-sm font-medium tracking-tight text-foreground"
            >
              Verification code
            </label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className={inputClassName}
              placeholder="Enter the code from your email"
              value={code}
              onChange={(event) => setCode(event.target.value)}
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

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Verify email"}
          </Button>

          <button
            type="button"
            className="w-full text-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:text-foreground/80"
            onClick={() => {
              setPendingVerification(false);
              setCode("");
            }}
          >
            Go back
          </button>
        </form>
      ) : (
        <form className="space-y-5 p-4" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium tracking-tight text-foreground">
                Account role
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose whether this account belongs to a school manager, teacher, or student.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {roleOptions.map((option) => {
                const isActive = role === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={[
                      "rounded-2xl border px-4 py-4 text-left transition-colors",
                      isActive
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:bg-muted",
                    ].join(" ")}
                    onClick={() => setRole(option.value)}
                  >
                    <p className="text-sm font-semibold tracking-tight">
                      {option.label}
                    </p>
                    <p
                      className={[
                        "mt-2 text-sm leading-6",
                        isActive
                          ? "text-background/80"
                          : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {role === "school" ? (
            <div className="space-y-2">
              <label
                htmlFor="managerName"
                className="text-sm font-medium tracking-tight text-foreground"
              >
                Manager name
              </label>
              <input
                id="managerName"
                type="text"
                autoComplete="name"
                className={inputClassName}
                placeholder="School manager full name"
                value={managerName}
                onChange={(event) => setManagerName(event.target.value)}
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-sm font-medium tracking-tight text-foreground"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                className={inputClassName}
                placeholder="Your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </div>
          )}

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

          {role !== "student" ? (
            <div className="space-y-2">
              <label
                htmlFor="school"
                className="text-sm font-medium tracking-tight text-foreground"
              >
                {role === "school" ? "School name" : "School"}
              </label>
              <input
                id="school"
                type="text"
                autoComplete="organization"
                className={inputClassName}
                placeholder="School name"
                value={school}
                onChange={(event) => setSchool(event.target.value)}
                required
              />
            </div>
          ) : null}

          {role === "school" ? (
            <>
              <div className="space-y-2">
                <label
                  htmlFor="address"
                  className="text-sm font-medium tracking-tight text-foreground"
                >
                  Address
                </label>
                <input
                  id="address"
                  type="text"
                  className={inputClassName}
                  placeholder="School address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="aimag"
                  className="text-sm font-medium tracking-tight text-foreground"
                >
                  Aimag
                </label>
                <select
                  id="aimag"
                  className={inputClassName}
                  value={aimag}
                  onChange={(event) =>
                    setAimag(event.target.value as (typeof mongoliaAimags)[number])
                  }
                  required
                >
                  {mongoliaAimags.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : role === "student" ? (
            <>
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium tracking-tight text-foreground"
                >
                  Student phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className={inputClassName}
                  placeholder="Student phone number"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="inviteCode"
                  className="text-sm font-medium tracking-tight text-foreground"
                >
                  Class code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  className={inputClassName}
                  placeholder="TEACHER-CODE"
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  required
                />
              </div>

            </>
          ) : (
            <>
              <div className="space-y-2">
                <label
                  htmlFor="subject"
                  className="text-sm font-medium tracking-tight text-foreground"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  className={inputClassName}
                  placeholder="Mathematics"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium tracking-tight text-foreground"
                >
                  Phone (optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className={inputClassName}
                  placeholder="Your phone number"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium tracking-tight text-foreground"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              placeholder="Create a password"
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

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>

          <div id="clerk-captcha" />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-foreground/80"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
