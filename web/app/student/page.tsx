"use client";

import { useAuth, useSignIn, useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import studentHome from "/public/studentHome.png";

type FormValues = {
  email: string;
  lastName: string;
  firstName: string;
  school: string;
  grade: string;
  group: string;
  password: string;
  confirmPassword: string;
};

const initialFormValues: FormValues = {
  email: "",
  lastName: "",
  firstName: "",
  school: "",
  grade: "",
  group: "",
  password: "",
  confirmPassword: "",
};

type AuthMode = "sign-up" | "sign-in";

const inputClassName =
  "h-12 w-full rounded-[14px] border border-[#EAE6F5] bg-white px-4 text-[15px] text-[#1F1B2D] shadow-none outline-none transition-colors placeholder:text-[#B7B0C8] focus:border-[#A592FF] focus:ring-4 focus:ring-[#A592FF]/10";

function getErrorMessages(errors: unknown) {
  if (!Array.isArray(errors)) {
    if (
      typeof errors === "object" &&
      errors !== null &&
      "raw" in errors &&
      Array.isArray(errors.raw)
    ) {
      return getErrorMessages(errors.raw);
    }

    if (
      typeof errors === "object" &&
      errors !== null &&
      "global" in errors &&
      Array.isArray(errors.global)
    ) {
      return getErrorMessages(errors.global);
    }

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

    return "Алдаа гарлаа. Дахин оролдоно уу.";
  });
}

function FormField({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
}: {
  id: keyof FormValues;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder: string;
  autoComplete?: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-2.5">
      <label
        htmlFor={id}
        className="block text-[15px] font-semibold tracking-tight text-[#292235]"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  value,
  visible,
  onChange,
  onToggle,
}: {
  id: "password" | "confirmPassword";
  label: string;
  placeholder: string;
  autoComplete?: string;
  value: string;
  visible: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onToggle: () => void;
}) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="space-y-2.5">
      <label
        htmlFor={id}
        className="block text-[15px] font-semibold tracking-tight text-[#292235]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className={`${inputClassName} pr-12`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          aria-label={visible ? "Нууц үгийг нуух" : "Нууц үгийг харах"}
          onClick={onToggle}
          className="absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#A49CB9] transition hover:bg-[#F6F3FF] hover:text-[#6F5AD8]"
        >
          <Icon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function StudentIllustration() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "720px",
        aspectRatio: "679 / 642.86",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-6%",
          borderRadius: "80px",
          background: "linear-gradient(180deg, #E9D0F7 0%, #B8CBF7 100%)",
          opacity: 0.45,
          filter: "blur(90px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "3%",
          borderRadius: "60px",
          background: "linear-gradient(180deg, #E9D0F7 0%, #B8CBF7 100%)",
          opacity: 0.72,
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "6%",
          borderRadius: "48px",
          background: "linear-gradient(180deg, #EDE0FA 0%, #C5D4F8 100%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "6%",
          borderRadius: "48px",
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.55) 0%, transparent 62%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "6%",
          borderRadius: "48px",
          border: "1.5px solid rgba(255,255,255,0.6)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "6%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "70%",
          height: "60px",
          borderRadius: "9999px",
          background: "rgba(214, 204, 255, 0.5)",
          filter: "blur(32px)",
          pointerEvents: "none",
        }}
      />
      <Image
        src={studentHome}
        alt="Student illustration"
        width={560}
        height={560}
        priority
        style={{
          position: "relative",
          zIndex: 10,
          width: "78%",
          height: "auto",
          maxWidth: "none",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "block",
        }}
      />
    </div>
  );
}

export default function StudentPage() {
  const router = useRouter();
  const { signIn, fetchStatus: signInFetchStatus, errors: signInErrors } = useSignIn();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-up");
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/student/account");
    }
  }, [isSignedIn, router]);

  const resolvedFormValues = formValues;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (feedback) {
      setFeedback(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (resolvedFormValues.password.length < 8) {
      setFeedback({
        tone: "error",
        message: "Нууц үг хамгийн багадаа 8 тэмдэгттэй байх хэрэгтэй.",
      });
      return;
    }

    if (resolvedFormValues.password !== resolvedFormValues.confirmPassword) {
      setFeedback({
        tone: "error",
        message: "Нууц үг давтах талбар ижил биш байна.",
      });
      return;
    }

    if (!acceptedTerms) {
      setFeedback({
        tone: "error",
        message: "Үйлчилгээний нөхцөлийг зөвшөөрнө үү.",
      });
      return;
    }

    const grade = resolvedFormValues.grade.trim();
    const group = resolvedFormValues.group.trim().toUpperCase();
    const fullName = `${resolvedFormValues.lastName.trim()} ${resolvedFormValues.firstName.trim()}`.trim();
    const passwordPayload: Parameters<typeof signUp.password>[0] = {
      emailAddress: resolvedFormValues.email.trim(),
      password: resolvedFormValues.password,
      unsafeMetadata: {
        role: "student",
        fullName,
        school: resolvedFormValues.school.trim(),
        grade,
        className: group ? `${grade}${group}` : grade,
      },
    };

    const { error } = await signUp.password(passwordPayload);

    if (error) {
      const requestErrors = getErrorMessages(error);
      if (requestErrors.length > 0) {
        setFeedback({
          tone: "error",
          message: requestErrors[0],
        });
      }
      return;
    }


    const sendCodeResult = await signUp.verifications.sendEmailCode();
    if (!sendCodeResult.error) {
      setPendingVerification(true);
      setFeedback({
        tone: "success",
        message: "Баталгаажуулах код таны и-мэйл рүү илгээгдлээ.",
      });
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const { error } = await signUp.verifications.verifyEmailCode({
      code,
    });

    if (error) {
      const requestErrors = getErrorMessages(error);
      if (requestErrors.length > 0) {
        setFeedback({
          tone: "error",
          message: requestErrors[0],
        });
      }
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize({
        navigate: () => {
          router.push("/student/account");
        },
      });
    }
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const { error } = await signIn.password({
      emailAddress: resolvedFormValues.email.trim(),
      password: resolvedFormValues.password,
    });

    if (error) {
      const requestErrors = getErrorMessages(error);
      if (requestErrors.length > 0) {
        setFeedback({
          tone: "error",
          message: requestErrors[0],
        });
      }
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          const rawRole = session?.user?.unsafeMetadata?.role;
          const targetUrl = rawRole === "student" ? "/student/account" : "/dashboard";
          const url = decorateUrl(targetUrl);

          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
      return;
    }

    setFeedback({
      tone: "error",
      message: "Нэмэлт баталгаажуулалт шаардлагатай байна.",
    });
  };

  const errorMessages = getErrorMessages(errors);
  const signInErrorMessages = getErrorMessages(signInErrors);
  const isSubmitting = fetchStatus === "fetching";
  const isSigningIn = signInFetchStatus === "fetching";

  if (isSignedIn) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FEFCFF]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_42%,rgba(183,169,255,0.24),transparent_24%),radial-gradient(circle_at_66%_52%,rgba(190,236,255,0.16),transparent_18%),linear-gradient(180deg,#FFFFFF_0%,#FEFBFF_100%)]" />

      <section className="mx-auto grid min-h-screen w-full max-w-[1320px] items-center gap-10 px-6 py-8 lg:grid-cols-[minmax(0,1.08fr)_420px] lg:gap-16 lg:px-10 lg:py-12">
        <div className="order-2 lg:order-1">
          <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-[42px] px-4 py-8 lg:min-h-[720px] lg:px-8">
            <StudentIllustration />
          </div>
        </div>

        <div className="order-1 w-full max-w-[420px] justify-self-end lg:order-2">
          <div className="space-y-1">
            <p className="text-[13px] font-semibold tracking-[0.24em] text-[#A29AB9] uppercase">
              Student Account
            </p>
            <h1 className="text-[40px] leading-tight font-semibold tracking-tight text-[#201A2F]">
              {mode === "sign-up" ? "Бүртгүүлэх" : "Нэвтрэх"}
            </h1>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-[20px] bg-[#F4F0FF] p-1.5">
            <button
              type="button"
              onClick={() => {
                setMode("sign-up");
                setPendingVerification(false);
                setCode("");
                setFeedback(null);
              }}
              className={`h-11 rounded-[16px] text-[15px] font-semibold transition ${mode === "sign-up"
                ? "bg-white text-[#201A2F] shadow-[0_10px_24px_rgba(90,70,170,0.12)]"
                : "text-[#7B7394]"
                }`}
            >
              Бүртгэл үүсгэх
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("sign-in");
                setPendingVerification(false);
                setCode("");
                setFeedback(null);
              }}
              className={`h-11 rounded-[16px] text-[15px] font-semibold transition ${mode === "sign-in"
                ? "bg-white text-[#201A2F] shadow-[0_10px_24px_rgba(90,70,170,0.12)]"
                : "text-[#7B7394]"
                }`}
            >
              Нэвтрэх
            </button>
          </div>

          {feedback ? (
            <div
              className={`mt-6 rounded-[18px] border px-4 py-3 text-[14px] ${feedback.tone === "success"
                ? "border-[#D6F4DD] bg-[#F4FFF6] text-[#1E6E36]"
                : "border-[#FFD8D8] bg-[#FFF7F7] text-[#B63B3B]"
                }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {mode === "sign-up" && pendingVerification ? (
            <form className="mt-8 space-y-5" onSubmit={handleVerify}>
              <div className="space-y-2.5">
                <label
                  htmlFor="code"
                  className="block text-[15px] font-semibold tracking-tight text-[#292235]"
                >
                  Баталгаажуулах код
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className={inputClassName}
                  placeholder="И-мэйл дээр ирсэн кодоо оруулна уу"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  required
                />
              </div>

              {errorMessages.length > 0 ? (
                <div className="rounded-[18px] border border-[#FFD8D8] bg-[#FFF7F7] px-4 py-3 text-[14px] text-[#B63B3B]">
                  {errorMessages.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}

              <div className="flex justify-between gap-3 pt-4">
                <button
                  type="button"
                  className="h-12 rounded-[16px] px-5 text-[15px] font-semibold text-[#6F5AD8] transition hover:bg-[#F6F3FF]"
                  onClick={() => {
                    setPendingVerification(false);
                    setCode("");
                  }}
                >
                  Буцах
                </button>
                <Button
                  type="submit"
                  className="h-12 min-w-[140px] cursor-pointer rounded-[16px] bg-[#9B85FF] px-7 text-[15px] font-semibold text-white shadow-[0_16px_30px_rgba(155,133,255,0.34)] hover:bg-[#8D74FC]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Шалгаж байна..." : "Нэвтрэх"}
                </Button>
              </div>
            </form>
          ) : mode === "sign-up" ? (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <FormField
                id="email"
                label="И-мэйл"
                type="email"
                autoComplete="email"
                placeholder="example@school.mn"
                value={resolvedFormValues.email}
                onChange={handleInputChange}
              />

              <FormField
                id="lastName"
                label="Овог"
                autoComplete="family-name"
                placeholder="Овог"
                value={resolvedFormValues.lastName}
                onChange={handleInputChange}
              />

              <FormField
                id="firstName"
                label="Нэр"
                autoComplete="given-name"
                placeholder="Нэр"
                value={resolvedFormValues.firstName}
                onChange={handleInputChange}
              />

              <FormField
                id="school"
                label="Сургууль"
                autoComplete="organization"
                placeholder="Сургууль"
                value={resolvedFormValues.school}
                onChange={handleInputChange}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  id="grade"
                  label="Анги"
                  placeholder="10"
                  value={resolvedFormValues.grade}
                  onChange={handleInputChange}
                />

                <FormField
                  id="group"
                  label="Бүлэг"
                  placeholder="A"
                  value={resolvedFormValues.group}
                  onChange={handleInputChange}
                />
              </div>

              <PasswordField
                id="password"
                label="Нууц үг"
                autoComplete="new-password"
                placeholder="........"
                value={resolvedFormValues.password}
                visible={showPassword}
                onChange={handleInputChange}
                onToggle={() => setShowPassword((previous) => !previous)}
              />

              <PasswordField
                id="confirmPassword"
                label="Нууц үг давтах"
                autoComplete="new-password"
                placeholder="........"
                value={resolvedFormValues.confirmPassword}
                visible={showConfirmPassword}
                onChange={handleInputChange}
                onToggle={() => setShowConfirmPassword((previous) => !previous)}
              />

              <label className="flex items-start gap-3 rounded-[18px] border border-[#EAE6F5] bg-white px-4 py-3 text-[14px] text-[#51475A]">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#CFC7E6] accent-[#9B85FF]"
                />
                <span>
                  Би PineQuest-ийн үйлчилгээний нөхцөл болон бүртгэлийн
                  шаардлагыг зөвшөөрч байна.
                </span>
              </label>

              <div
                id="clerk-captcha"
                data-cl-theme="light"
                data-cl-size="flexible"
                data-cl-language="auto"
                className="min-h-16 overflow-hidden rounded-[18px]"
              />

              {errorMessages.length > 0 ? (
                <div className="rounded-[18px] border border-[#FFD8D8] bg-[#FFF7F7] px-4 py-3 text-[14px] text-[#B63B3B]">
                  {errorMessages.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-12 min-w-[140px] cursor-pointer rounded-[16px] bg-[#9B85FF] px-7 text-[15px] font-semibold text-white shadow-[0_16px_30px_rgba(155,133,255,0.34)] hover:bg-[#8D74FC]"
                >
                  {isSubmitting ? "Бүртгэж байна..." : "Бүртгүүлэх"}
                </Button>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleSignIn}>
              <FormField
                id="email"
                label="И-мэйл"
                type="email"
                autoComplete="email"
                placeholder="example@school.mn"
                value={resolvedFormValues.email}
                onChange={handleInputChange}
              />

              <PasswordField
                id="password"
                label="Нууц үг"
                autoComplete="current-password"
                placeholder="........"
                value={resolvedFormValues.password}
                visible={showPassword}
                onChange={handleInputChange}
                onToggle={() => setShowPassword((previous) => !previous)}
              />

              {signInErrorMessages.length > 0 ? (
                <div className="rounded-[18px] border border-[#FFD8D8] bg-[#FFF7F7] px-4 py-3 text-[14px] text-[#B63B3B]">
                  {signInErrorMessages.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 pt-4">
                <p className="text-[14px] text-[#6E6783]">
                  Шинэ хэрэглэгч үү?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("sign-up");
                      setFeedback(null);
                    }}
                    className="font-semibold text-[#6F5AD8] hover:text-[#5C48C7]"
                  >
                    Бүртгэл үүсгэх
                  </button>
                </p>
                <Button
                  type="submit"
                  disabled={isSigningIn}
                  className="h-12 min-w-[140px] cursor-pointer rounded-[16px] bg-[#201A2F] px-7 text-[15px] font-semibold text-white shadow-[0_16px_30px_rgba(32,26,47,0.24)] hover:bg-[#181326]"
                >
                  {isSigningIn ? "Нэвтэрч байна..." : "Нэвтрэх"}
                </Button>
              </div>

              <p className="text-center text-[14px] text-[#7B7394]">
                Нийтлэг нэвтрэх хуудас хэрэгтэй бол{" "}
                <Link href="/sign-in" className="font-semibold text-[#6F5AD8] hover:text-[#5C48C7]">
                  энд дарна уу
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
