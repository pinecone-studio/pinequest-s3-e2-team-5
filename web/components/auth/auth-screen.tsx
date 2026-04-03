"use client";

import { useAuth, useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type HTMLInputTypeAttribute,
} from "react";
import { Button } from "@/components/ui/button";
import { getRoleHomePath, isUserRole, type UserRole } from "@/lib/auth-role";
import teacherHome from "/public/teacherHome.png";


type AuthScreenProps = {
  mode: "sign-in" | "sign-up";
};

type SignUpRole = Extract<UserRole, "student" | "teacher">;

type FormValues = {
  role: SignUpRole;
  email: string;
  lastName: string;
  firstName: string;
  phone: string;
  classCode: string;
  password: string;
  confirmPassword: string;
};

const initialFormValues: FormValues = {
  role: "student",
  email: "",
  lastName: "",
  firstName: "",
  phone: "",
  classCode: "",
  password: "",
  confirmPassword: "",
};

const demoCredentials = {
  student: {
    email: "breexy20@gmail.com",
    password: "teamPassword!",
  },
  teacher: {
    email: "batzorig.chinbat19@gmail.com",
    password: "teamPassword!",
  },
} as const;

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
  type?: HTMLInputTypeAttribute;
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

function SelectField({
  id,
  label,
  value,
  onChange,
}: {
  id: "role";
  label: string;
  value: SignUpRole;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="space-y-2.5">
      <label
        htmlFor={id}
        className="block text-[15px] font-semibold tracking-tight text-[#292235]"
      >
        {label}
      </label>
      <select
        id={id}
        name={id}
        className={inputClassName}
        value={value}
        onChange={onChange}
      >
        <option value="student">Сурагч</option>
        <option value="teacher">Багш</option>
      </select>
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


export default function StudentIllustration() {
  return (
    <div className="relative w-[413px] h-[428px] mx-auto">

      {/* Blur Ellipse (Figma background) */}
      <div
        className="
          absolute
          w-[642px]
          h-[642px]
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2
          rounded-[100%]
          opacity-400
          blur-[30px]
        "
        style={{
          background:
            "linear-gradient(180deg, #E9D0F7 10%, #B8CBF7 100%)",
        }}
      />

      {/* Image */}
      <Image
        src="/studentHome.png"
        alt="Student illustration"
        width={413}
        height={428}
        className="
          relative
          z-10
          w-full
          h-full
          object-contain
        "
      />
    </div>
  );
}
export function TeacherIllustration() {
  return (
    <div className="relative w-[413px] h-[428px] mx-auto">

      {/* Blur Ellipse (Figma background) */}
      <div
        className="
              absolute
              w-[642px]
              h-[600px]
              left-1/2
              top-1/2
              -translate-x-1/2
              -translate-y-1/2
              rounded-[70%]
              opacity-400
              blur-[40px]
            "
        style={{
          background:
            "linear-gradient(180deg, #E9D0F7 10%, #B8CBF7 100%)",
        }}
      />

      {/* Image */}
      <Image
        src={teacherHome}
        alt="Student illustration"
        width={413}
        height={428}
        className="
              relative
              z-10
              w-full
              h-full
              object-contain
            "
      />
    </div>
  );
}


export function AuthScreen({ mode }: AuthScreenProps) {
  const router = useRouter();
  const {
    signIn,
    fetchStatus: signInFetchStatus,
    errors: signInErrors,
  } = useSignIn();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingSignInVerification, setPendingSignInVerification] =
    useState(false);
  const [code, setCode] = useState("");
  const [feedback, setFeedback] = useState<{
    tone: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }

    const rawRole = user?.unsafeMetadata?.role;
    const role = isUserRole(rawRole) ? rawRole : null;
    router.replace(role ? getRoleHomePath(role) : "/dashboard");
  }, [isSignedIn, router, user]);

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

  const handleRoleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const role = event.target.value as SignUpRole;

    setFormValues((previous) => ({
      ...previous,
      role,
      classCode: role === "student" ? previous.classCode : "",
    }));

    if (feedback) {
      setFeedback(null);
    }
  };

  const autofillDemoCredentials = (
    role: keyof typeof demoCredentials,
  ) => {
    const credentials = demoCredentials[role];

    setFormValues((previous) => ({
      ...previous,
      email: credentials.email,
      password: credentials.password,
    }));
    setPendingSignInVerification(false);
    setCode("");
    setFeedback(null);
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (formValues.password.length < 8) {
      setFeedback({
        tone: "error",
        message: "Нууц үг хамгийн багадаа 8 тэмдэгттэй байх хэрэгтэй.",
      });
      return;
    }

    if (formValues.password !== formValues.confirmPassword) {
      setFeedback({
        tone: "error",
        message: "Нууц үг давтах талбар ижил биш байна.",
      });
      return;
    }

    if (!formValues.firstName || !formValues.lastName) {
      setFeedback({
        tone: "error",
        message: "no name!",
      });
    }

    const firstName = formValues.firstName.trim();
    const lastName = formValues.lastName.trim();
    const normalizedPhone = formValues.phone.trim();

    if (!normalizedPhone) {
      setFeedback({
        tone: "error",
        message: "Утасны дугаараа оруулна уу.",
      });
      return;
    }

    if (formValues.role === "student" && !formValues.classCode.trim()) {
      setFeedback({
        tone: "error",
        message: "Ангийн кодоо оруулна уу.",
      });
      return;
    }

    const unsafeMetadata =
      formValues.role === "student"
        ? {
          role: "student" as const,
          firstName,
          lastName,
          phone: normalizedPhone,
          inviteCode: formValues.classCode.trim().toUpperCase(),
          classCode: formValues.classCode.trim().toUpperCase(),
        }
        : {
          role: "teacher" as const,
          firstName,
          lastName,
          phone: normalizedPhone,
        };

    const { error } = await signUp.password({
      emailAddress: formValues.email.trim(),
      password: formValues.password,
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      unsafeMetadata,
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

    console.log(signUp.missingFields)

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
        navigate: ({ session, decorateUrl }) => {
          const rawRole = session?.user?.unsafeMetadata?.role;
          const targetUrl = isUserRole(rawRole)
            ? getRoleHomePath(rawRole)
            : "/dashboard";
          const url = decorateUrl(targetUrl);

          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
    }
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setPendingSignInVerification(false);

    const { error } = await signIn.password({
      emailAddress: formValues.email.trim(),
      password: formValues.password,
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
          const targetUrl = isUserRole(rawRole)
            ? getRoleHomePath(rawRole)
            : "/dashboard";
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

    if (signIn.status === "needs_second_factor") {
      const supportsEmailCode = (signIn.supportedSecondFactors ?? []).some(
        (factor) => factor.strategy === "email_code",
      );

      if (!supportsEmailCode) {
        setFeedback({
          tone: "error",
          message:
            "Энэ бүртгэлд нэмэлт баталгаажуулалт шаардлагатай байна. И-мэйл кодын баталгаажуулалт идэвхгүй байна.",
        });
        return;
      }

      const sendCodeResult = await signIn.mfa.sendEmailCode();
      if (sendCodeResult.error) {
        const requestErrors = getErrorMessages(sendCodeResult.error);
        if (requestErrors.length > 0) {
          setFeedback({
            tone: "error",
            message: requestErrors[0],
          });
        }
        return;
      }

      setCode("");
      setPendingSignInVerification(true);
      setFeedback({
        tone: "success",
        message:
          "Нэмэлт баталгаажуулах код таны и-мэйл рүү илгээгдлээ.",
      });
      return;
    }

    setFeedback({
      tone: "error",
      message: "Нэмэлт баталгаажуулалт шаардлагатай байна.",
    });
  };

  const handleVerifySignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const { error } = await signIn.mfa.verifyEmailCode({
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

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          const rawRole = session?.user?.unsafeMetadata?.role;
          const targetUrl = isUserRole(rawRole)
            ? getRoleHomePath(rawRole)
            : "/dashboard";
          const url = decorateUrl(targetUrl);

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
  const signInErrorMessages = getErrorMessages(signInErrors);
  const isSubmitting = fetchStatus === "fetching";
  const isSigningIn = signInFetchStatus === "fetching";
  const isSignUpMode = mode === "sign-up";
  const isTeacherRole = formValues.role === "teacher";

  if (isSignedIn) {
    return null;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FEFCFF]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_42%,rgba(183,169,255,0.24),transparent_24%),radial-gradient(circle_at_66%_52%,rgba(190,236,255,0.16),transparent_18%),linear-gradient(180deg,#FFFFFF_0%,#FEFBFF_100%)]" />

      <section className="mx-auto grid min-h-screen w-full max-w-[1320px] items-center gap-10 px-6 py-8 lg:grid-cols-[minmax(0,1.08fr)_420px] lg:gap-16 lg:px-10 lg:py-12">
        <div className="order-2 lg:order-1">
          <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-[42px] px-4 py-8 lg:min-h-[720px] lg:px-8">
            {isTeacherRole ? <TeacherIllustration /> : <StudentIllustration />}
          </div>
        </div>

        <div className="order-1 w-full max-w-[420px] justify-self-end lg:order-2">
          <div className="space-y-1">
            <p className="text-[13px] font-semibold tracking-[0.24em] text-[#A29AB9] uppercase">
              {isSignUpMode ? "Create Account" : "Account Login"}
            </p>
            <div className="flex items-center w-full justify-between">
              <h1 className="text-[40px] leading-tight font-semibold tracking-tight text-[#201A2F]">
                {isSignUpMode ? "Бүртгэл үүсгэх" : "Нэвтрэх"}
              </h1>
              <div className="flex flex-col">
                <Button
                  type="button"
                  onClick={() => autofillDemoCredentials("student")}
                >
                  Demo as student
                </Button>
                <Button
                  type="button"
                  onClick={() => autofillDemoCredentials("teacher")}
                >
                  Demo as teacher
                </Button>
              </div>
            </div>
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

          {isSignUpMode && pendingVerification ? (
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
          ) : !isSignUpMode && pendingSignInVerification ? (
            <form className="mt-8 space-y-5" onSubmit={handleVerifySignIn}>
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

              {signInErrorMessages.length > 0 ? (
                <div className="rounded-[18px] border border-[#FFD8D8] bg-[#FFF7F7] px-4 py-3 text-[14px] text-[#B63B3B]">
                  {signInErrorMessages.map((message) => (
                    <p key={message}>{message}</p>
                  ))}
                </div>
              ) : null}

              <div className="flex justify-between gap-3 pt-4">
                <button
                  type="button"
                  className="h-12 rounded-[16px] px-5 text-[15px] font-semibold text-[#6F5AD8] transition hover:bg-[#F6F3FF]"
                  onClick={() => {
                    setPendingSignInVerification(false);
                    setCode("");
                  }}
                >
                  Буцах
                </button>
                <Button
                  type="submit"
                  className="h-12 min-w-[140px] cursor-pointer rounded-[16px] bg-[#201A2F] px-7 text-[15px] font-semibold text-white shadow-[0_16px_30px_rgba(32,26,47,0.24)] hover:bg-[#181326]"
                  disabled={isSigningIn}
                >
                  {isSigningIn ? "Шалгаж байна..." : "Баталгаажуулах"}
                </Button>
              </div>
            </form>
          ) : isSignUpMode ? (
            <form className="mt-8 space-y-5" onSubmit={handleSignUp}>
              <SelectField
                id="role"
                label="Роль сонгох"
                value={formValues.role}
                onChange={handleRoleChange}
              />

              <FormField
                id="email"
                label="И-мэйл"
                type="email"
                autoComplete="email"
                placeholder="example@school.mn"
                value={formValues.email}
                onChange={handleInputChange}
              />

              <FormField
                id="lastName"
                label="Овог"
                autoComplete="family-name"
                placeholder="Овог"
                value={formValues.lastName}
                onChange={handleInputChange}
              />

              <FormField
                id="firstName"
                label="Нэр"
                autoComplete="given-name"
                placeholder="Нэр"
                value={formValues.firstName}
                onChange={handleInputChange}
              />

              <FormField
                id="phone"
                label="Утасны дугаар"
                autoComplete="tel"
                placeholder="99112233"
                value={formValues.phone}
                onChange={handleInputChange}
              />

              {isTeacherRole ? (
                <></>
              ) : (
                <FormField
                  id="classCode"
                  label="Ангийн код"
                  placeholder="ABC123"
                  value={formValues.classCode}
                  onChange={handleInputChange}
                />
              )}

              <PasswordField
                id="password"
                label="Нууц үг"
                autoComplete="new-password"
                placeholder="........"
                value={formValues.password}
                visible={showPassword}
                onChange={handleInputChange}
                onToggle={() => setShowPassword((previous) => !previous)}
              />

              <PasswordField
                id="confirmPassword"
                label="Нууц үг давтах"
                autoComplete="new-password"
                placeholder="........"
                value={formValues.confirmPassword}
                visible={showConfirmPassword}
                onChange={handleInputChange}
                onToggle={() => setShowConfirmPassword((previous) => !previous)}
              />

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

              <div className="flex items-center justify-between gap-4 pt-4">
                <p className="text-[14px] text-[#6E6783]">
                  Бүртгэлтэй юу?{" "}
                  <Link
                    href="/sign-in"
                    className="font-semibold text-[#6F5AD8] hover:text-[#5C48C7]"
                  >
                    Нэвтрэх
                  </Link>
                </p>
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
                value={formValues.email}
                onChange={handleInputChange}
              />

              <PasswordField
                id="password"
                label="Нууц үг"
                autoComplete="current-password"
                placeholder="........"
                value={formValues.password}
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
                  <Link
                    href="/sign-up"
                    className="font-semibold text-[#6F5AD8] hover:text-[#5C48C7]"
                  >
                    Бүртгэл үүсгэх
                  </Link>
                </p>
                <Button
                  type="submit"
                  disabled={isSigningIn}
                  className="h-12 min-w-[140px] cursor-pointer rounded-[16px] bg-[#201A2F] px-7 text-[15px] font-semibold text-white shadow-[0_16px_30px_rgba(32,26,47,0.24)] hover:bg-[#181326]"
                >
                  {isSigningIn ? "Нэвтэрч байна..." : "Нэвтрэх"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
