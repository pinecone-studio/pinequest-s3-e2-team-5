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
  fullName: string;
  phone: string;
  school: string;
  managerName: string;
  address: string;
  aimag: string;
  grade: string;
  className: string;
  inviteCode: string;
  subject: string;
  role: UserRole;
};

export function CloudflareStudentSync({
  email,
  fullName,
  phone,
  school,
  managerName,
  address,
  aimag,
  grade,
  className,
  inviteCode,
  subject,
  role,
}: CloudflareStudentSyncProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState("");
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (hasAttemptedRef.current || !isLoaded || !isSignedIn) {
      return;
    }

    const apiUrl = getCloudflareGraphqlUrl();
    if (!apiUrl) {
      setStatus("Cloudflare sync URL missing.");
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

        if (role === "school") {
          if (!email || !school || !managerName) {
            throw new Error("School sync needs manager name, email, and school.");
          }

          if (!managerName || !address || !aimag) {
            throw new Error("School sync needs manager name, address, and aimag.");
          }

          await syncRoleProfileToCloudflare({
            token,
            apiUrl,
            role,
            input: {
              schoolName: school,
              email,
              managerName,
              address,
              aimag,
            },
          });
        } else if (role === "student") {
          if (!email || !fullName || !school) {
            throw new Error("Student sync needs name, email, and school.");
          }

          if (!phone || !className || !inviteCode) {
            throw new Error("Student sync needs phone, class, and invite code.");
          }

          await syncRoleProfileToCloudflare({
            token,
            apiUrl,
            role,
            input: {
              fullName,
              email,
              phone,
              school,
              grade: grade || className,
              className,
              inviteCode,
            },
          });
        } else {
          if (!email || !fullName || !school) {
            throw new Error("Teacher sync needs name, email, and school.");
          }

          if (!subject) {
            throw new Error("Teacher sync needs subject.");
          }

          await syncRoleProfileToCloudflare({
            token,
            apiUrl,
            role,
            input: {
              fullName,
              email,
              phone,
              school,
              subject,
            },
          });
        }

        setStatus(`Cloudflare ${role} profile synced.`);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Cloudflare sync failed.";
        setStatus(message);
      }
    })();
  }, [
    className,
    email,
    fullName,
    getToken,
    grade,
    managerName,
    address,
    aimag,
    inviteCode,
    isLoaded,
    isSignedIn,
    phone,
    role,
    school,
    subject,
  ]);

  if (!status) {
    return null;
  }

  return <p className="mt-4 text-xs leading-6 text-background/70">{status}</p>;
}
