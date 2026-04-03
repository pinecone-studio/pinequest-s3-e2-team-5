import { usePreventScreenCapture, useScreenshotListener } from "expo-screen-capture";
import { AppState } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
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
import type { IntegrityAutoSubmitReason, NativeFaceStatus, ViolationLog, ViolationType } from "@/security/types";

const NO_FACE_AUTO_SUBMIT_MS = 5000;
const MULTIPLE_FACES_AUTO_SUBMIT_MS = 7000;

type UseExamIntegrityOptions = {
  userId: string;
  examId: string;
  onAutoSubmit: (reason: "timer" | IntegrityAutoSubmitReason) => Promise<void>;
};

export function useExamIntegrity({ userId, examId, onAutoSubmit }: UseExamIntegrityOptions) {
  const [leaveCount, setLeaveCount] = useState(0);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [recordingCount, setRecordingCount] = useState(0);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const [warningMessage, setWarningMessage] = useState("");
  const [recordingBlurActive, setRecordingBlurActive] = useState(false);
  const { faceStatus, nativeMonitoringAvailable } = useFaceIntegrity();

  const leaveCountRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);
  const backgroundStartedAtRef = useRef<number | null>(null);
  const recordingStartedAtRef = useRef<number | null>(null);
  const currentFaceStatusRef = useRef<NativeFaceStatus>(faceStatus);
  const noFaceStartedAtRef = useRef<number | null>(null);
  const noFaceAutoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const multipleFacesStartedAtRef = useRef<number | null>(null);
  const multipleFacesAutoSubmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSubmitInFlightRef = useRef(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionReplaceHandledRef = useRef(false);
  const lastCaptureStateRef = useRef<boolean | null>(null);

  usePreventScreenCapture(`exam-${examId}`);

  const showWarning = useCallback((message: string, durationMs = 2600) => {
    setWarningMessage(message);

    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }

    overlayTimerRef.current = setTimeout(() => {
      setWarningMessage("");
      overlayTimerRef.current = null;
    }, durationMs);
  }, []);

  const pushViolation = useCallback(async (type: ViolationType, duration = 0) => {
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
  }, [examId, userId]);

  useEffect(() => {
    void (async () => {
      const existing = await listViolationLogsForExam(userId, examId);
      setViolationLogs(existing);
    })();
  }, [examId, userId]);

  useEffect(() => {
    currentFaceStatusRef.current = faceStatus;
  }, [faceStatus]);

  const clearNoFaceWatch = useCallback(() => {
    noFaceStartedAtRef.current = null;

    if (noFaceAutoSubmitTimerRef.current) {
      clearTimeout(noFaceAutoSubmitTimerRef.current);
      noFaceAutoSubmitTimerRef.current = null;
    }
  }, []);

  const clearMultipleFacesWatch = useCallback(() => {
    multipleFacesStartedAtRef.current = null;

    if (multipleFacesAutoSubmitTimerRef.current) {
      clearTimeout(multipleFacesAutoSubmitTimerRef.current);
      multipleFacesAutoSubmitTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    sessionReplaceHandledRef.current = false;
    autoSubmitInFlightRef.current = false;
    clearNoFaceWatch();
    clearMultipleFacesWatch();
  }, [clearMultipleFacesWatch, clearNoFaceWatch, examId]);

  useEffect(() => {
    if (faceStatus !== "no_face") {
      clearNoFaceWatch();
    }

    if (faceStatus !== "multiple_faces") {
      clearMultipleFacesWatch();
    }

    if (faceStatus === "no_face" && !noFaceAutoSubmitTimerRef.current) {
      const startedAt = Date.now();
      noFaceStartedAtRef.current = startedAt;
      showWarning("Нүүр илрэхгүй байна. 5 секунд үргэлжилбэл шалгалтыг автоматаар илгээнэ.");

      noFaceAutoSubmitTimerRef.current = setTimeout(() => {
        noFaceAutoSubmitTimerRef.current = null;

        if (currentFaceStatusRef.current !== "no_face" || autoSubmitInFlightRef.current) {
          return;
        }

        const duration = Math.max(Date.now() - startedAt, NO_FACE_AUTO_SUBMIT_MS);
        autoSubmitInFlightRef.current = true;
        void pushViolation("no_face", duration);
        showWarning("5 секундээс илүү хугацаанд нүүр илрээгүй тул шалгалтыг автоматаар илгээнэ.");
        void onAutoSubmit("no_face").finally(() => {
          autoSubmitInFlightRef.current = false;
        });
      }, NO_FACE_AUTO_SUBMIT_MS);
    }

    if (faceStatus === "multiple_faces" && !multipleFacesAutoSubmitTimerRef.current) {
      const startedAt = Date.now();
      multipleFacesStartedAtRef.current = startedAt;
      showWarning("Олон нүүр илэрлээ. 7 секунд үргэлжилбэл шалгалтыг автоматаар илгээнэ.");

      multipleFacesAutoSubmitTimerRef.current = setTimeout(() => {
        multipleFacesAutoSubmitTimerRef.current = null;

        if (currentFaceStatusRef.current !== "multiple_faces" || autoSubmitInFlightRef.current) {
          return;
        }

        const duration = Math.max(Date.now() - startedAt, MULTIPLE_FACES_AUTO_SUBMIT_MS);
        autoSubmitInFlightRef.current = true;
        void pushViolation("multi_face", duration);
        showWarning("7 секундээс илүү хугацаанд олон нүүр илэрсэн тул шалгалтыг автоматаар илгээнэ.");
        void onAutoSubmit("multiple_faces").finally(() => {
          autoSubmitInFlightRef.current = false;
        });
      }, MULTIPLE_FACES_AUTO_SUBMIT_MS);
    }
  }, [clearMultipleFacesWatch, clearNoFaceWatch, faceStatus, onAutoSubmit, pushViolation, showWarning]);

  useEffect(() => {
    noFaceStartedAtRef.current = null;
    multipleFacesStartedAtRef.current = null;
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
  }, [onAutoSubmit, pushViolation, showWarning]);

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
  }, [examId, userId, pushViolation, showWarning]);

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
        autoSubmitInFlightRef.current = true;
        void onAutoSubmit("session_replaced").finally(() => {
          autoSubmitInFlightRef.current = false;
        });
      },
    });

    void sessionIntegrity.start().catch(() => {});

    return () => {
      void sessionIntegrity.stop().catch(() => {});
    };
  }, [examId, onAutoSubmit, pushViolation, showWarning, userId]);

  useEffect(() => {
    return () => {
      clearNoFaceWatch();
      clearMultipleFacesWatch();

      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
    };
  }, [clearMultipleFacesWatch, clearNoFaceWatch]);

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
