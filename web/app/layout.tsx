import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Poppins } from "next/font/google";
import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";
import "katex/dist/katex.min.css";
import ApolloWrapper from "./apollo-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

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
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ClerkProvider appearance={clerkAppearance}>
          <div className="relative flex min-h-screen flex-col">
            <ApolloWrapper>{children}</ApolloWrapper>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
