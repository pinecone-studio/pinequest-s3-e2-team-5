import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="relative flex flex-1 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(17,24,39,0.12),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(120,113,108,0.18),_transparent_30%)]" />
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,420px)] lg:py-20">
        <div className="flex flex-col justify-center gap-6">
          <div className="inline-flex w-fit items-center rounded-full border border-border/80 bg-background/85 px-4 py-2 text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase shadow-sm backdrop-blur">
            {eyebrow}
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="grid max-w-xl gap-4 text-sm leading-7 text-muted-foreground sm:grid-cols-2">
            <div className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm backdrop-blur">
              Built on Clerk prebuilt components for faster auth rollout.
            </div>
            <div className="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm backdrop-blur">
              Redirects are already configured to land authenticated users on
              the dashboard.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-[2rem] border border-border/70 bg-card/90 p-3 shadow-xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-background p-2">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
