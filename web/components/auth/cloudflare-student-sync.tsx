"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  getCloudflareGraphqlUrl,
  syncStudentToCloudflare,
} from "@/lib/cloudflare-sync";

type CloudflareStudentSyncProps = {
  email: string;
  fullName: string;
  phone: string;
  role: "student" | "teacher";
};

export function CloudflareStudentSync({
  email,
  fullName,
  phone,
  role,
}: CloudflareStudentSyncProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState("");
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedRef.current || !isLoaded || !isSignedIn || role !== "student") {
      return;
    }

    const apiUrl = getCloudflareGraphqlUrl();
    if (!apiUrl) {
      setStatus("Cloudflare sync URL missing.");
      return;
    }

    if (!email || !fullName || !phone) {
      setStatus("Cloudflare sync needs full name, email, and phone.");
      return;
    }

    hasAttemptedRef.current = true;

    void (async () => {
      try {
        setStatus("Syncing profile to Cloudflare...");
        const token = await getToken();

        if (!token) {
          throw new Error("Missing Clerk session token.");
        }

        await syncStudentToCloudflare({
          token,
          apiUrl,
          input: {
            email,
            fullName,
            phone,
          },
        });

        setStatus("Cloudflare student profile synced.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Cloudflare sync failed.";
        setStatus(message);
      }
    })();
  }, [email, fullName, getToken, isLoaded, isSignedIn, phone, role]);

  if (!status || role !== "student") {
    return null;
  }

  return <p className="mt-4 text-xs leading-6 text-background/70">{status}</p>;
}
