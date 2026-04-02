import { useEffect, useRef, useState } from "react";
import {
  isNativeSecureExamAvailable,
  startNativeFaceMonitoring,
  stopNativeFaceMonitoring,
  subscribeFaceEvents,
} from "@/security/native-secure-exam";
import type {
  NativeFaceIntegrityEvent,
  NativeFaceStatus,
  NormalizedFaceCount,
} from "@/security/types";

type UseFaceIntegrityOptions = {
  bootstrapTimeoutMs?: number;
};

type UseFaceIntegrityResult = {
  faceCount: NormalizedFaceCount;
  faceStatus: NativeFaceStatus;
  lastViolation: NativeFaceIntegrityEvent | null;
  nativeMonitoringAvailable: boolean;
};

export function useFaceIntegrity({
  bootstrapTimeoutMs = 6000,
}: UseFaceIntegrityOptions = {}): UseFaceIntegrityResult {
  const [faceCount, setFaceCount] = useState<NormalizedFaceCount>(0);
  const [faceStatus, setFaceStatus] = useState<NativeFaceStatus>(
    isNativeSecureExamAvailable ? "checking" : "unsupported",
  );
  const [lastViolation, setLastViolation] = useState<NativeFaceIntegrityEvent | null>(null);

  const mountedRef = useRef(true);
  const lastFaceCountRef = useRef<NormalizedFaceCount>(0);
  const lastFaceStatusRef = useRef<NativeFaceStatus>(
    isNativeSecureExamAvailable ? "checking" : "unsupported",
  );
  const lastViolationTimestampRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isNativeSecureExamAvailable) {
      if (lastFaceStatusRef.current !== "unsupported") {
        lastFaceStatusRef.current = "unsupported";
        setFaceStatus("unsupported");
      }
      return;
    }

    let cancelled = false;

    lastFaceStatusRef.current = "checking";
    setFaceStatus("checking");

    // Native monitoring can take a moment to boot, especially after camera permission prompts.
    // A bounded timeout prevents the UI from staying in "checking" forever.
    const bootstrapTimer = setTimeout(() => {
      if (cancelled || !mountedRef.current) {
        return;
      }

      if (lastFaceStatusRef.current === "checking") {
        lastFaceStatusRef.current = "unsupported";
        setFaceStatus("unsupported");
      }
    }, bootstrapTimeoutMs);

    const subscription = subscribeFaceEvents((event) => {
      if (cancelled || !mountedRef.current) {
        return;
      }

      clearTimeout(bootstrapTimer);

      if (!event.supported) {
        if (lastFaceStatusRef.current !== "unsupported") {
          lastFaceStatusRef.current = "unsupported";
          setFaceStatus("unsupported");
        }
        return;
      }

      const nextStatus: NativeFaceStatus =
        event.faceCount === 0
          ? "no_face"
          : event.faceCount === 1
            ? "single_face"
            : "multiple_faces";

      // Face stream can run for 60-90 minute exam sessions. Guard unchanged values so
      // React only rerenders when the stabilized face state actually changed.
      if (lastFaceCountRef.current !== event.faceCount) {
        lastFaceCountRef.current = event.faceCount;
        setFaceCount(event.faceCount);
      }

      if (lastFaceStatusRef.current !== nextStatus) {
        lastFaceStatusRef.current = nextStatus;
        setFaceStatus(nextStatus);
      }

      if (
        event.integrityEvent &&
        event.ts > lastViolationTimestampRef.current
      ) {
        lastViolationTimestampRef.current = event.ts;
        setLastViolation({
          type: event.integrityEvent,
          faceCount: event.faceCount,
          timestamp: event.ts,
        });
      }
    });

    void startNativeFaceMonitoring().catch(() => {
      clearTimeout(bootstrapTimer);

      if (cancelled || !mountedRef.current) {
        return;
      }

      lastFaceStatusRef.current = "unsupported";
      setFaceStatus("unsupported");
    });

    return () => {
      cancelled = true;
      clearTimeout(bootstrapTimer);
      subscription.remove();
      void stopNativeFaceMonitoring().catch(() => {});
    };
  }, [bootstrapTimeoutMs]);

  return {
    faceCount,
    faceStatus,
    lastViolation,
    nativeMonitoringAvailable: isNativeSecureExamAvailable,
  };
}
