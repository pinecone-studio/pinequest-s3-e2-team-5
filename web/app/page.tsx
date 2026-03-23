import { Show } from "@clerk/nextjs";
import { ArrowRight, LockKeyhole, ShieldCheck, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: ShieldCheck,
    title: "Protected routes",
    description:
      "Clerk runs in proxy.ts and keeps the /dashboard experience behind an authenticated session.",
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
