import {
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
} from "expo-screen-capture";
import { requireNativeModule } from "expo-modules-core";
import type {
  CaptureStateSnapshot,
  NativeCaptureStateEvent,
  NativeFaceCountEvent,
  NativeFaceEvent,
  NativeRecordingEvent,
} from "@/security/types";

type NativeSubscription = {
  remove(): void;
};

type SecureExamNativeModule = {
  startMonitoring?: (payload: { userId: string; examId: string }) => Promise<void>;
  stopMonitoring?: () => Promise<void>;
  startFaceStream?: () => Promise<void>;
  stopFaceStream?: () => Promise<void>;
  setSensitiveBlurEnabled?: (enabled: boolean) => Promise<void>;
  enableSecureSnapshot?: () => Promise<void>;
  disableSecureSnapshot?: () => Promise<void>;
  getCurrentCaptureState?: () => Promise<NativeCaptureStateEvent> | NativeCaptureStateEvent;
  addListener?: (
    eventName: "onCaptureStateChanged" | "onFaceCountChanged",
    listener:
      | ((event: NativeCaptureStateEvent) => void)
      | ((event: NativeFaceCountEvent) => void),
  ) => NativeSubscription;
};

let nativeModule: SecureExamNativeModule | null = null;

try {
  nativeModule = requireNativeModule<SecureExamNativeModule>("SecureExamGuard");
} catch {
  nativeModule = null;
}

export const isNativeSecureExamAvailable = nativeModule !== null;

export async function startNativeSecureExamMonitoring(payload: { userId: string; examId: string }) {
  await nativeModule?.startMonitoring?.(payload);
}

export async function stopNativeSecureExamMonitoring() {
  await nativeModule?.stopMonitoring?.();
}

export async function startNativeFaceMonitoring() {
  await nativeModule?.startFaceStream?.();
}

export async function stopNativeFaceMonitoring() {
  await nativeModule?.stopFaceStream?.();
}

export async function setNativeSensitiveBlurEnabled(enabled: boolean) {
  await nativeModule?.setSensitiveBlurEnabled?.(enabled);
}

export async function getCurrentCaptureState() {
  if (!nativeModule?.getCurrentCaptureState) {
    return false;
  }

  try {
    const snapshot = await nativeModule.getCurrentCaptureState();
    return snapshot.state === "active";
  } catch {
    return false;
  }
}

function getEventTimestamp(event: { ts: number }) {
  return typeof event.ts === "number" ? event.ts : Date.now();
}

export function subscribeCaptureState(listener: (event: CaptureStateSnapshot) => void): NativeSubscription {
  if (!nativeModule) {
    return {
      remove() {},
    };
  }

  // Native code emits only raw device signals. Normalization stays in TypeScript.
  const subscription =
    nativeModule.addListener?.("onCaptureStateChanged", (event: NativeCaptureStateEvent) => {
      listener({
        isCaptured: event.state === "active",
        timestamp: getEventTimestamp(event),
      });
    }) ?? {
      remove() {},
    };
  return {
    remove() {
      subscription.remove();
    },
  };
}

export function subscribeFaceEvents(listener: (event: NativeFaceCountEvent) => void): NativeSubscription {
  if (!nativeModule) {
    return {
      remove() {},
    };
  }

  const subscription = nativeModule.addListener?.("onFaceCountChanged", listener) ?? {
    remove() {},
  };
  return {
    remove() {
      subscription.remove();
    },
  };
}

export function addNativeRecordingListener(
  listener: (event: NativeRecordingEvent) => void,
): NativeSubscription {
  return subscribeCaptureState((event) => {
    listener({
      isCaptured: event.isCaptured,
      timestamp: event.timestamp,
    });
  });
}

export function addNativeFaceListener(listener: (event: NativeFaceEvent) => void): NativeSubscription {
  return subscribeFaceEvents((event) => {
    listener({
      status:
        event.faceCount < 0
          ? "unsupported"
          : event.faceCount === 0
            ? "no_face"
            : event.faceCount === 1
              ? "single_face"
              : "multiple_faces",
      timestamp: getEventTimestamp(event),
    });
  });
}

export async function enableSecureSnapshot() {
  if (nativeModule?.enableSecureSnapshot) {
    await nativeModule.enableSecureSnapshot();
    return;
  }

  await enableAppSwitcherProtectionAsync(0.95);
}

export async function disableSecureSnapshot() {
  if (nativeModule?.disableSecureSnapshot) {
    await nativeModule.disableSecureSnapshot();
    return;
  }

  await disableAppSwitcherProtectionAsync();
}
