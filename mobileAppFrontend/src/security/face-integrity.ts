import {
  subscribeFaceEvents,
  startNativeFaceMonitoring,
  stopNativeFaceMonitoring,
} from "@/security/native-secure-exam";
import type { FaceIntegrityViolation, NativeFaceStatus } from "@/security/types";

type FaceViolationListener = (violation: FaceIntegrityViolation) => void;
type FaceStatusListener = (status: NativeFaceStatus) => void;

type CreateFaceIntegrityServiceOptions = {
  missingThresholdMs?: number;
  multipleFacesCooldownMs?: number;
  onStatusChange?: FaceStatusListener;
};

export function createFaceIntegrityService({
  missingThresholdMs = 5000,
  multipleFacesCooldownMs = 3000,
  onStatusChange,
}: CreateFaceIntegrityServiceOptions = {}) {
  let faceMissingStartedAt: number | null = null;
  let multipleFacesLastRaisedAt = 0;
  let removeNativeListener: (() => void) | null = null;
  const violationListeners = new Set<FaceViolationListener>();

  const emitViolation = (violation: FaceIntegrityViolation) => {
    violationListeners.forEach((listener) => {
      listener(violation);
    });
  };

  const handleStatus = (status: NativeFaceStatus, timestamp: number) => {
    onStatusChange?.(status);

    if (status === "multiple_faces") {
      if (timestamp - multipleFacesLastRaisedAt >= multipleFacesCooldownMs) {
        multipleFacesLastRaisedAt = timestamp;
        emitViolation({
          type: "multiple_faces",
          duration: 0,
          timestamp,
        });
      }
      return;
    }

    if (status === "no_face") {
      if (!faceMissingStartedAt) {
        faceMissingStartedAt = timestamp;
      }
      return;
    }

    if (status === "single_face" && faceMissingStartedAt) {
      const duration = Math.max(timestamp - faceMissingStartedAt, 0);
      faceMissingStartedAt = null;

      if (duration >= missingThresholdMs) {
        emitViolation({
          type: "no_face",
          duration,
          timestamp,
        });
      }
      return;
    }

    faceMissingStartedAt = null;
  };

  return {
    async startFaceMonitoring() {
      removeNativeListener?.();
      removeNativeListener = null;

      const subscription = subscribeFaceEvents((event) => {
        const status =
          event.faceCount < 0
            ? "unsupported"
            : event.faceCount === 0
              ? "no_face"
              : event.faceCount === 1
                ? "single_face"
                : "multiple_faces";
        handleStatus(status, event.ts);
      });

      removeNativeListener = () => {
        subscription.remove();
      };

      await startNativeFaceMonitoring();
    },

    async stopFaceMonitoring() {
      removeNativeListener?.();
      removeNativeListener = null;
      faceMissingStartedAt = null;
      await stopNativeFaceMonitoring();
    },

    onFaceViolation(listener: FaceViolationListener) {
      violationListeners.add(listener);

      return () => {
        violationListeners.delete(listener);
      };
    },
  };
}
