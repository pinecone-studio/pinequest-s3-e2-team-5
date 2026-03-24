import { Show } from "@clerk/nextjs";
import {
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import { BarChart, DoughnutChart, type ChartData } from "@/components/charts";
import { MathBlock, MathInline } from "@/components/math";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: ShieldCheck,
    title: "Protected routes",
    description:
      "Clerk runs in middleware.ts and keeps the /dashboard experience behind an authenticated session.",
  },
  {
    icon: LockKeyhole,
    title: "Custom auth pages",
    description:
      "Dedicated /sign-in and /sign-up routes are ready for Clerk's prebuilt components.",
  },
  {
    icon: UserRoundCheck,
    title: "Session-aware UI",
    description:
      "The landing page, header, and dashboard all react to Clerk's signed-in and signed-out state.",
  },
] as const;

const blockEquation = String.raw`\int_0^1 x^2\,dx = \frac{1}{3}`;

const inlineEquation = String.raw`e^{i\pi} + 1 = 0`;

const activityChartData: ChartData<"bar"> = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  datasets: [
    {
      label: "Solved quizzes",
      data: [18, 24, 20, 31, 27, 36],
      backgroundColor: [
        "#111827",
        "#1f2937",
        "#334155",
        "#0f766e",
        "#0f766e",
        "#f59e0b",
      ],
      borderRadius: 999,
      borderSkipped: false,
      maxBarThickness: 26,
    },
  ],
};

const progressChartData: ChartData<"doughnut"> = {
  labels: ["Completed", "In review", "Needs retry"],
  datasets: [
    {
      data: [62, 23, 15],
      backgroundColor: ["#111827", "#0f766e", "#f59e0b"],
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
};

export default function Home() {
  return (
    <main className="relative flex flex-1 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.12),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(120,113,108,0.16),_transparent_30%)]" />
      <section className="mx-auto grid w-full max-w-6xl gap-16 px-6 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)] lg:py-24">
        <div className="flex flex-col justify-center gap-8">
          <div className="inline-flex w-fit items-center rounded-full border border-border/80 bg-background/80 px-4 py-2 text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase shadow-sm backdrop-blur">
            Next.js 16 + Clerk
          </div>
          <div className="space-y-6">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Authentication is now first-class in PineQuest.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Clerk is connected to the app router with dedicated sign-in and
              sign-up pages, a protected dashboard route, and session-aware UI
              across the app shell.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Show when="signed-out">
              <Button asChild size="lg" className="min-w-40">
                <Link href="/sign-up">Create account</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-w-40">
                <Link href="/sign-in">Open sign in</Link>
              </Button>
            </Show>
            <Show when="signed-in">
              <Button asChild size="lg" className="min-w-40">
                <Link href="/dashboard" prefetch={false}>
                  Open dashboard
                </Link>
              </Button>
            </Show>
          </div>
        </div>

        <div className="grid gap-4 self-center">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-muted text-foreground">
                  <Icon className="size-5" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            );
          })}

          <article className="overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur">
            <p className="text-sm font-medium tracking-[0.22em] text-muted-foreground uppercase">
              KaTeX ready
            </p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              Formula rendering is available in the app shell.
            </h2>
            <MathBlock
              math={blockEquation}
              className="mt-4 overflow-x-auto rounded-2xl bg-muted/70 px-4 py-5 text-foreground"
            />
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Inline math also works:
              <MathInline
                math={inlineEquation}
                className="ml-2 text-foreground"
              />
            </p>
          </article>

          <article className="overflow-hidden rounded-3xl border border-border/70 bg-card/85 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium tracking-[0.22em] text-muted-foreground uppercase">
                  Chart.js ready
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-tight">
                  Charts now plug into the app with a single import.
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  The registration boilerplate lives in one wrapper, so pages
                  can render charts directly with <code>BarChart</code> or <code>DoughnutChart</code>.
                </p>
              </div>
              <div className="hidden rounded-full border border-border/70 px-3 py-1 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase sm:block">
                Demo data
              </div>
            </div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(220px,280px)]">
              <div className="rounded-2xl bg-muted/60 p-4">
                <BarChart data={activityChartData} className="h-64" />
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <DoughnutChart data={progressChartData} className="h-64" />
              </div>
            </div>
          </article>

          <div className="rounded-3xl border border-border/70 bg-foreground p-6 text-background shadow-lg">
            <p className="text-sm font-medium tracking-[0.22em] text-background/70 uppercase">
              Ready to test
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              Create a Clerk user and land straight in the protected dashboard.
            </p>
            <Link
              href="/dashboard"
              prefetch={false}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-background/90 transition hover:text-background"
            >
              Try the protected route
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
