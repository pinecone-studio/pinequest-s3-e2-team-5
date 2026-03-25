import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";
import "katex/dist/katex.min.css";

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
        <ClerkProvider appearance={clerkAppearance}>
          <div className="relative flex min-h-screen flex-col">{children}</div>
        </ClerkProvider>
      </body>
    </html>
  );
}
