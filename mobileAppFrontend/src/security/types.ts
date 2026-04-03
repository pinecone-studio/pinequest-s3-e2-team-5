export type ViolationType =
  | "app_switch"
  | "no_face"
  | "multi_face"
  | "recording"
  | "screenshot"
  | "session_replaced";

export type IntegrityAutoSubmitReason =
  | "background"
  | "session_replaced"
  | "no_face"
  | "multiple_faces";

export type NormalizedFaceCount = 0 | 1 | 2;

export type NativeFaceIntegrityEventType =
  | "NO_FACE"
  | "MULTIPLE_FACES"
  | "FACE_RETURNED";

export type ViolationLog = {
  id: string;
  userId: string;
  examId: string;
  timestamp: number;
  type: ViolationType;
  duration: number;
};

export type NativeFaceStatus =
  | "checking"
  | "single_face"
  | "no_face"
  | "multiple_faces"
  | "unsupported";

export type NativeRecordingEvent = {
  isCaptured: boolean;
  timestamp: number;
};

export type NativeCaptureStateEvent = {
  state: "active" | "inactive";
  ts: number;
};

export type NativeFaceEvent = {
  status: NativeFaceStatus;
  timestamp: number;
};

export type NativeFaceCountEvent = {
  faceCount: NormalizedFaceCount;
  supported: boolean;
  integrityEvent: NativeFaceIntegrityEventType | null;
  ts: number;
};

export type NativeFaceIntegrityEvent = {
  type: NativeFaceIntegrityEventType;
  faceCount: NormalizedFaceCount;
  timestamp: number;
};

export type CaptureStateSnapshot = {
  isCaptured: boolean;
  timestamp: number;
};

export type FaceIntegrityViolation =
  | {
      type: "no_face";
      duration: number;
      timestamp: number;
    }
  | {
      type: "multiple_faces";
      duration: number;
      timestamp: number;
    };

export type SessionBackendStatus =
  | "ok"
  | "queued_offline"
  | "replaced_by_other_device"
  | "skipped";
