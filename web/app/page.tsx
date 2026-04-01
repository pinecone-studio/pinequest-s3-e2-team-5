import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import teacherHome from "/public/teacherHome.png";

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

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-12">
      <div className="absolute inset-0 -z-30 bg-white" />
      {/* <div className="absolute inset-0 -z-20 flex items-center justify-center">
        <div
          className="h-[62vh] w-[72vw] max-w-[1020px] rounded-[72px] opacity-55"
          style={{
            background:
              "linear-gradient(211.38deg, #E9D0F7 18.64%, #B8CBF7 83.45%)",
          }}
        />
      </div> */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_18%,rgba(255,255,255,0.84)_72%,#ffffff_100%)]" />

      <section className="mx-auto grid w-full max-w-6xl items-center gap-70 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex items-center justify-center">
          <div className="relative flex w-full max-w-[540px] items-center justify-center">
            <TeacherIllustration />
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
