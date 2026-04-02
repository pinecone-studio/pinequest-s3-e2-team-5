import { usePreventScreenCapture, useScreenshotListener } from "expo-screen-capture";
import { AppState } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useFaceIntegrity } from "@/hooks/useFaceIntegrity";
import {
  disableSecureSnapshot,
  enableSecureSnapshot,
  getCurrentCaptureState,
  isNativeSecureExamAvailable,
  setNativeSensitiveBlurEnabled,
  subscribeCaptureState,
  startNativeSecureExamMonitoring,
  stopNativeSecureExamMonitoring,
} from "@/security/native-secure-exam";
import { appendViolationLog, listViolationLogsForExam } from "@/security/violation-log";
import { createSessionIntegrity } from "@/security/session-integrity";
import type { NativeFaceStatus, ViolationLog, ViolationType } from "@/security/types";

type UseExamIntegrityOptions = {
  userId: string;
  examId: string;
  onAutoSubmit: (reason: "timer" | "background" | "session_replaced") => Promise<void>;
};

export function useExamIntegrity({ userId, examId, onAutoSubmit }: UseExamIntegrityOptions) {
  const [leaveCount, setLeaveCount] = useState(0);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [recordingCount, setRecordingCount] = useState(0);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const [warningMessage, setWarningMessage] = useState("");
  const [recordingBlurActive, setRecordingBlurActive] = useState(false);
  const {
    faceStatus,
    lastViolation: lastFaceViolation,
    nativeMonitoringAvailable,
  } = useFaceIntegrity();

  const leaveCountRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  const backgroundStartedAtRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const noFaceStartedAtRef = useRef<number | null>(null);
  const noFaceViolationCountRef = useRef(0);
  const autoSubmitInFlightRef = useRef(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionReplaceHandledRef = useRef(false);
  const lastCaptureStateRef = useRef<boolean | null>(null);
  const lastHandledFaceViolationTsRef = useRef(0);

  usePreventScreenCapture(`exam-${examId}`);

  const showWarning = (message: string, durationMs = 2600) => {
    setWarningMessage(message);

    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }

    overlayTimerRef.current = setTimeout(() => {
      setWarningMessage("");
      overlayTimerRef.current = null;
    }, durationMs);
  };

  const pushViolation = async (type: ViolationType, duration = 0) => {
    const log = await appendViolationLog({
      userId,
      examId,
      type,
      duration,
    });

    setViolationLogs((current) => [log, ...current].slice(0, 100));

    if (type === "recording") {
      setRecordingCount((current) => current + 1);
    }
  };

  useEffect(() => {
    void (async () => {
      const existing = await listViolationLogsForExam(userId, examId);
      setViolationLogs(existing);
    })();
  }, [examId, userId]);

  useEffect(() => {
    noFaceStartedAtRef.current = null;
    noFaceViolationCountRef.current = 0;
    lastHandledFaceViolationTsRef.current = 0;
  }, [examId]);

  useEffect(() => {
    void enableSecureSnapshot().catch(() => {});

    return () => {
      void disableSecureSnapshot().catch(() => {});
    };
  }, []);

  useScreenshotListener(() => {
    setScreenshotCount((current) => current + 1);
    showWarning("Дэлгэцийн зураг авсан нь илэрлээ. Энэ үйлдэл зөрчлийн бүртгэлд хадгалагдлаа.");
    void pushViolation("screenshot");
  });

  useEffect(() => {
    leaveCountRef.current = leaveCount;
  }, [leaveCount]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;

      if (previousState === "active" && nextState !== "active") {
        backgroundStartedAtRef.current = Date.now();
        void enableSecureSnapshot().catch(() => {});
        setLeaveCount((current) => {
          const next = current + 1;
          leaveCountRef.current = next;
          return next;
        });
      }

      if (previousState !== "active" && nextState === "active" && backgroundStartedAtRef.current) {
        const duration = Date.now() - backgroundStartedAtRef.current;
        backgroundStartedAtRef.current = null;
        void disableSecureSnapshot().catch(() => {});

        void pushViolation("app_switch", duration);

        if (duration > 5000 && !autoSubmitInFlightRef.current) {
          autoSubmitInFlightRef.current = true;
          showWarning("Та 5 секундээс илүү аппаас гарсан тул шалгалтыг автоматаар илгээнэ.");
          void onAutoSubmit("background").finally(() => {
            autoSubmitInFlightRef.current = false;
          });
        } else if (leaveCountRef.current > 3) {
          showWarning("Аппаас 3-аас олон удаа гарсан нь бүртгэгдлээ. Энэ нь зөрчилд тооцогдоно.");
        }
      }

      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
    };
  }, [onAutoSubmit]);

  useEffect(() => {
    if (!isNativeSecureExamAvailable) {
      return;
    }

    const handleCaptureState = (event: { isCaptured: boolean; timestamp: number }) => {
      if (lastCaptureStateRef.current === event.isCaptured) {
        return;
      }

      lastCaptureStateRef.current = event.isCaptured;

      if (event.isCaptured) {
        recordingStartedAtRef.current = event.timestamp;
        setRecordingBlurActive(true);
        showWarning("Дэлгэц бичлэг эсвэл дэлгэц толиндуулалт илэрлээ. Агуулгыг бүдгэрүүлж байна.");
        void setNativeSensitiveBlurEnabled(true).catch(() => {});
        void pushViolation("recording");
      } else {
        recordingStartedAtRef.current = null;
        setRecordingBlurActive(false);
        void setNativeSensitiveBlurEnabled(false).catch(() => {});
      }
    };

    void startNativeSecureExamMonitoring({ userId, examId }).catch(() => {});

    const recordingSubscription = subscribeCaptureState((event) => {
      handleCaptureState(event);
    });

    void (async () => {
      const isCaptured = await getCurrentCaptureState();
      handleCaptureState({
        isCaptured,
        timestamp: Date.now(),
      });
    })();

    return () => {
      recordingSubscription.remove();
      lastCaptureStateRef.current = null;
      void setNativeSensitiveBlurEnabled(false).catch(() => {});
      void stopNativeSecureExamMonitoring().catch(() => {});
    };
  }, [examId, onAutoSubmit, userId]);

  useEffect(() => {
    if (!lastFaceViolation) {
      return;
    }

    if (lastFaceViolation.timestamp <= lastHandledFaceViolationTsRef.current) {
      return;
    }

    lastHandledFaceViolationTsRef.current = lastFaceViolation.timestamp;

    if (lastFaceViolation.type === "NO_FACE") {
      if (!noFaceStartedAtRef.current) {
        noFaceStartedAtRef.current = lastFaceViolation.timestamp;
      }
      return;
    }

    if (lastFaceViolation.type === "MULTIPLE_FACES") {
      showWarning("Олон нүүр илэрлээ. Энэ үйлдэл зөрчлийн бүртгэлд хадгалагдлаа.");
      void pushViolation("multi_face");
      return;
    }

    if (!noFaceStartedAtRef.current) {
      return;
    }

    const duration = Math.max(lastFaceViolation.timestamp - noFaceStartedAtRef.current, 0);
    noFaceStartedAtRef.current = null;

    if (duration < 5000) {
      return;
    }

    noFaceViolationCountRef.current += 1;
    showWarning(
      noFaceViolationCountRef.current > 1
        ? "Нүүр олон дахин алдагдлаа. Энэ үйлдэл зөрчлийн бүртгэлд хадгалагдлаа."
        : "5 секундээс илүү хугацаанд нүүр илрээгүй байна.",
    );
    void pushViolation("no_face", duration);
  }, [lastFaceViolation]);

  useEffect(() => {
    if (faceStatus === "unsupported" || faceStatus === "checking") {
      noFaceStartedAtRef.current = null;
    }
  }, [faceStatus]);

  useEffect(() => {
    const sessionIntegrity = createSessionIntegrity({
      userId,
      examId,
      onSessionReplaced: () => {
        if (sessionReplaceHandledRef.current) {
          return;
        }

        sessionReplaceHandledRef.current = true;
        showWarning("Өөр төхөөрөмжөөс шалгалтын төлөв орлогдсон тул шалгалтыг автоматаар илгээнэ.");
        void pushViolation("session_replaced");
        void onAutoSubmit("session_replaced");
      },
    });

    void sessionIntegrity.start().catch(() => {});

    return () => {
      void sessionIntegrity.stop().catch(() => {});
    };
  }, [examId, onAutoSubmit, userId]);

  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
    };
  }, []);

  return {
    leaveCount,
    screenshotCount,
    recordingCount,
    violationCount: violationLogs.length,
    violationLogs,
    warningMessage,
    recordingBlurActive,
    faceStatus,
    nativeMonitoringAvailable,
  };
}
