"use client";

import { useAuth, useUser } from "@clerk/clerk-expo";
import { useEffect, useRef, useState } from "react";
import { syncStudentProfileToCloudflare } from "@/lib/cloudflare-sync";

export function useStudentProfileSync() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [statusMessage, setStatusMessage] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const syncedRef = useRef(false);

  const firstName =
    typeof user?.unsafeMetadata?.firstName === "string"
      ? user.unsafeMetadata.firstName
      : user?.firstName || "";
  const lastName =
    typeof user?.unsafeMetadata?.lastName === "string"
      ? user.unsafeMetadata.lastName
      : user?.lastName || "";
  const phone =
    typeof user?.unsafeMetadata?.phone === "string" ? user.unsafeMetadata.phone : "";
  const inviteCode =
    typeof user?.unsafeMetadata?.inviteCode === "string"
      ? user.unsafeMetadata.inviteCode
      : "";
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const role = user?.unsafeMetadata?.role;
  const canSync = role === "student" && Boolean(firstName && lastName && phone && inviteCode && email);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !canSync || syncedRef.current) {
      if (isLoaded && isSignedIn && role === "student" && !canSync) {
        setStatusMessage("Энэ аккаунт student sync хийхэд шаардлагатай phone/class code metadata-гүй байна.");
      }

      return;
    }

    let cancelled = false;

    void (async () => {
      setIsSyncing(true);
      setStatusMessage("Student профайлыг шалгаж байна...");

      try {
        const token = await getToken();

        if (!token) {
          throw new Error("Clerk session token олдсонгүй.");
        }

        await syncStudentProfileToCloudflare({
          token,
          input: {
            firstName,
            lastName,
            email,
            phone,
            inviteCode,
          },
        });

        syncedRef.current = true;
        if (!cancelled) {
          setStatusMessage("Student профайл амжилттай sync хийгдлээ.");
        }
      } catch (caughtError) {
        if (!cancelled) {
          setStatusMessage(
            caughtError instanceof Error
              ? caughtError.message
              : "Student профайл sync хийхэд алдаа гарлаа.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canSync, email, firstName, getToken, inviteCode, isLoaded, isSignedIn, lastName, phone, role]);

  return {
    statusMessage,
    isSyncing,
    canSync,
  };
}
