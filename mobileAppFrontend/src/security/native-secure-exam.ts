import {
  disableAppSwitcherProtectionAsync,
  enableAppSwitcherProtectionAsync,
} from "expo-screen-capture";
import { requireNativeModule } from "expo-modules-core";
import type { CaptureStateSnapshot, NativeFaceEvent, NativeRecordingEvent } from "@/security/types";

type NativeSubscription = {
  remove(): void;
};

type SecureExamNativeModule = {
  startMonitoring?: (payload: { userId: string; examId: string }) => Promise<void>;
  stopMonitoring?: () => Promise<void>;
  startFaceMonitoring?: () => Promise<void>;
  stopFaceMonitoring?: () => Promise<void>;
  setSensitiveBlurEnabled?: (enabled: boolean) => Promise<void>;
  setPrivacyShieldEnabled?: (enabled: boolean) => Promise<void>;
  getCurrentCaptureState?: () => Promise<boolean>;
  addListener?: (
    eventName: "onRecordingChanged" | "onFaceStatusChanged" | "onCaptureStateChanged",
    listener:
      | ((event: NativeRecordingEvent) => void)
      | ((event: NativeFaceEvent) => void)
      | ((event: CaptureStateSnapshot) => void),
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
  await nativeModule?.startFaceMonitoring?.();
}

export async function stopNativeFaceMonitoring() {
  await nativeModule?.stopFaceMonitoring?.();
}

export async function setNativeSensitiveBlurEnabled(enabled: boolean) {
  await nativeModule?.setSensitiveBlurEnabled?.(enabled);
}

export async function getCurrentCaptureState() {
  if (!nativeModule?.getCurrentCaptureState) {
    return false;
  }

  try {
    return await nativeModule.getCurrentCaptureState();
  } catch {
    return false;
  }
}

export function subscribeCaptureState(listener: (event: CaptureStateSnapshot) => void): NativeSubscription {
  if (!nativeModule) {
    return {
      remove() {},
    };
  }

  const subscription = nativeModule.addListener?.("onCaptureStateChanged", listener) ?? {
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
  if (!nativeModule) {
    return {
      remove() {},
    };
  }

  const subscription = nativeModule.addListener?.("onFaceStatusChanged", listener) ?? {
    remove() {},
  };
  return {
    remove() {
      subscription.remove();
    },
  };
}

export async function enableSecureSnapshot() {
  if (nativeModule?.setPrivacyShieldEnabled) {
    await nativeModule.setPrivacyShieldEnabled(true);
    return;
  }

  await enableAppSwitcherProtectionAsync(0.95);
}

export async function disableSecureSnapshot() {
  if (nativeModule?.setPrivacyShieldEnabled) {
    await nativeModule.setPrivacyShieldEnabled(false);
    return;
  }

  await disableAppSwitcherProtectionAsync();
}
