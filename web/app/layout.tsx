import type { Metadata } from "next";
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import "./globals.css";

export const metadata: Metadata = {
  title: "PineQuest",
  description: "PineQuest with Clerk authentication on Next.js 16.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <ClerkProvider appearance={{ cssLayerName: "clerk" }}>
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur">
              <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
                <Link href="/" className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background">
                    PQ
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold tracking-[0.24em] text-foreground/70 uppercase">
                      PineQuest
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Clerk auth wired into the app router
                    </span>
                  </div>
                </Link>
                <div className="flex items-center gap-3">
                  <Show when="signed-out">
                    <Button asChild variant="ghost" size="lg">
                      <Link href="/sign-in">Sign in</Link>
                    </Button>
                    <Button asChild size="lg">
                      <Link href="/sign-up">Get started</Link>
                    </Button>
                  </Show>
                  <Show when="signed-in">
                    <Button asChild variant="outline" size="lg">
                      <Link href="/dashboard" prefetch={false}>
                        Dashboard
                      </Link>
                    </Button>
                    <UserButton />
                  </Show>
                </div>
              </div>
            </header>
            {children}
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
