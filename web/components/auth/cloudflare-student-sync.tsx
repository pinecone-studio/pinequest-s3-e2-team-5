"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  getCloudflareGraphqlUrl,
  syncRoleProfileToCloudflare,
} from "@/lib/cloudflare-sync";
import type { UserRole } from "@/lib/auth-role";

type CloudflareStudentSyncProps = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  grade: string;
  className: string;
  inviteCode: string;
  role: UserRole;
};

export function CloudflareStudentSync({
  email,
  firstName,
  lastName,
  phone,
  grade,
  className,
  inviteCode,
  role,
}: CloudflareStudentSyncProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState("");
  const [retryTick, setRetryTick] = useState(0);
  const retryCountRef = useRef(0);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (hasSyncedRef.current || !isLoaded || !isSignedIn) {
      return;
    }

    const apiUrl = getCloudflareGraphqlUrl();
    if (!apiUrl) {
      setStatus("Cloudflare sync URL missing.");
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (!cancelled) {
          setStatus("Syncing profile to Cloudflare...");
        }
        const token = await getToken();

        if (!token) {
          throw new Error("Missing Clerk session token.");
        }

        if (role === "student") {
          if (!email || !firstName || !lastName) {
            throw new Error("Student sync needs name and email.");
          }

          if (!phone || !inviteCode) {
            throw new Error("Student sync needs phone and class code.");
          }

          await syncRoleProfileToCloudflare({
            token,
            apiUrl,
            role,
            input: {
              firstName,
              lastName,
              email,
              phone,
              inviteCode,
            },
          });
        } else {
          if (!email || !firstName || !lastName) {
            throw new Error("Teacher sync needs name, email.");
          }

       

          await syncRoleProfileToCloudflare({
            token,
            apiUrl,
            role,
            input: {
              firstName,
              lastName,
              email,
              phone,
            },
          });
        }

        hasSyncedRef.current = true;
        retryCountRef.current = 0;
        if (!cancelled) {
          setStatus(`Cloudflare ${role} profile synced.`);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Cloudflare sync failed.";
        if (!cancelled) {
          setStatus(message);
        }

        if (hasSyncedRef.current) {
          return;
        }

        const isRetryableError =
          message.includes("Missing Clerk session token") ||
          message.includes("Sync failed with status") ||
          message.includes("Failed to fetch") ||
          message.includes("NetworkError");

        if (!isRetryableError) {
          return;
        }

        if (retryCountRef.current >= 4) {
          return;
        }

        retryCountRef.current += 1;
        setTimeout(() => {
          if (!cancelled && !hasSyncedRef.current) {
            setRetryTick((value) => value + 1);
          }
        }, 1200);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    className,
    email,
    firstName,
    lastName,
    getToken,
    grade,
    inviteCode,
    isLoaded,
    isSignedIn,
    phone,
    role,
    retryTick,
  ]);

  if (!status) {
    return null;
  }

  return <p className="mt-4 text-xs leading-6 text-background/70">{status}</p>;
}
