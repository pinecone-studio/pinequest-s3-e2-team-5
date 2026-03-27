import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
          border: "transparent",
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
        src="/studentHome.png"
        alt="Auth illustration"
        width={560}
        height={560}
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

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-12">
      <div className="absolute inset-0 -z-30 bg-white" />
      <div className="absolute inset-0 -z-20 flex items-center justify-center">
        <div
          className="h-[62vh] w-[72vw] max-w-[1020px] rounded-[72px] opacity-55"
          style={{
            background:
              "linear-gradient(211.38deg, #E9D0F7 18.64%, #B8CBF7 83.45%)",
          }}
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_18%,rgba(255,255,255,0.84)_72%,#ffffff_100%)]" />

      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex items-center justify-center">
          <div className="relative flex w-full max-w-[540px] items-center justify-center">
            <Image
              src="/studentHome.png"
              alt="Learning MS welcome illustration"
              width={413}
              height={428}
              priority
              className="h-auto w-full max-w-[360px] drop-shadow-[0_24px_40px_rgba(138,125,221,0.18)] lg:max-w-[430px]"
            />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[430px] flex-col items-start text-left">
          <h1 className="text-4xl font-semibold tracking-tight text-[#15111d] sm:text-5xl">
            Тавтай морил
          </h1>
          <p className="mt-5 max-w-[400px] text-lg leading-8 font-medium text-[#25202f]">
            Өөрийн эрхээр нэвтэрч хичээл, даалгавар, шалгалтаа хялбараар
            удирдаарай.
          </p>

          <div className="mt-10 flex w-full flex-col gap-4 sm:flex-row">
            <Button
              asChild
              className="h-11 min-w-[150px] rounded-full border-0 bg-[#9c7cf7] px-8 text-[15px] font-medium text-white shadow-[inset_0_-2px_0_rgba(118,85,216,0.45)] transition hover:bg-[#8f6df5]"
            >
              <Link href="/sign-up">Бүртгүүлэх</Link>
            </Button>
            <Button
              asChild
              className="h-11 min-w-[150px] rounded-full border-0 bg-[#9c7cf7] px-8 text-[15px] font-medium text-white shadow-[inset_0_-2px_0_rgba(118,85,216,0.45)] transition hover:bg-[#8f6df5]"
            >
              <Link href="/sign-in">Нэвтрэх</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
