import * as SecureStore from "expo-secure-store";
import { getMobileRemoteConfig } from "@/lib/mobile-graphql";
import { SessionBackendStatus } from "@/security/types";

const SESSION_QUEUE_KEY = "pinequest_session_integrity_queue";
const DEVICE_ID_KEY = "pinequest_device_integrity_id";
const HEARTBEAT_INTERVAL_MS = 25000;

type SessionActionType = "start" | "heartbeat" | "stop";

type SessionAction = {
  id: string;
  type: SessionActionType;
  userId: string;
  examId: string;
  deviceId: string;
  sessionId: string;
  timestamp: number;
};

type SessionBackendResponse = {
  status?: SessionBackendStatus;
};

type SessionBackendConfig = {
  endpoint: string;
  headers: Record<string, string>;
};

type CreateSessionIntegrityOptions = {
  userId: string;
  examId: string;
  onSessionReplaced: () => void;
};

function isPermanentSessionError(status: number) {
  return status === 400 || status === 401 || status === 403 || status === 404;
}

function buildRandomId(prefix: string) {
  const randomPart =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}_${randomPart.replace(/[^A-Za-z0-9._-]/g, "_")}`;
}

async function readQueue() {
  const raw = await SecureStore.getItemAsync(SESSION_QUEUE_KEY);

  if (!raw) {
    return [] as SessionAction[];
  }

  try {
    const parsed = JSON.parse(raw) as SessionAction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: SessionAction[]) {
  await SecureStore.setItemAsync(SESSION_QUEUE_KEY, JSON.stringify(queue.slice(-200)));
}

async function getDeviceId() {
  const current = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (current) {
    return current;
  }

  const next = buildRandomId("device");
  await SecureStore.setItemAsync(DEVICE_ID_KEY, next);
  return next;
}

async function enqueueAction(action: SessionAction) {
  const current = await readQueue();
  await writeQueue([...current, action]);
}

function getSessionBackendConfig(): SessionBackendConfig | null {
  const configuredEndpoint = process.env.EXPO_PUBLIC_SESSION_INTEGRITY_URL?.trim() ?? "";

  if (configuredEndpoint) {
    return {
      endpoint: configuredEndpoint,
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  const remoteConfig = getMobileRemoteConfig();

  if (!remoteConfig) {
    return null;
  }

  return {
    endpoint: remoteConfig.graphqlUrl.replace(/\/graphql\/?$/i, "/session-integrity"),
    headers: {
      "Content-Type": "application/json",
      "x-mobile-demo-key": remoteConfig.accessKey,
      "x-mobile-student-email": remoteConfig.studentEmail,
      ...(remoteConfig.studentInviteCode
        ? { "x-mobile-student-invite-code": remoteConfig.studentInviteCode }
        : {}),
    },
  };
}

async function postSessionAction(action: SessionAction): Promise<SessionBackendStatus> {
  const backendConfig = getSessionBackendConfig();

  if (!backendConfig) {
    await enqueueAction(action);
    return "queued_offline";
  }

  try {
    const response = await fetch(backendConfig.endpoint, {
      method: "POST",
      headers: backendConfig.headers,
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      if (isPermanentSessionError(response.status)) {
        return "skipped";
      }

      await enqueueAction(action);
      return "queued_offline";
    }

    const payload = (await response.json()) as SessionBackendResponse;
    return payload.status ?? "ok";
  } catch {
    await enqueueAction(action);
    return "queued_offline";
  }
}

async function flushQueuedActions() {
  const backendConfig = getSessionBackendConfig();

  if (!backendConfig) {
    return "skipped" as SessionBackendStatus;
  }

  const queue = await readQueue();

  if (queue.length === 0) {
    return "ok" as SessionBackendStatus;
  }

  const remaining: SessionAction[] = [];

  for (const action of queue) {
    try {
      const response = await fetch(backendConfig.endpoint, {
        method: "POST",
        headers: backendConfig.headers,
        body: JSON.stringify(action),
      });

      if (!response.ok) {
        if (isPermanentSessionError(response.status)) {
          continue;
        }

        remaining.push(action);
        continue;
      }

      const payload = (await response.json()) as SessionBackendResponse;
      if (payload.status === "replaced_by_other_device") {
        await writeQueue(remaining);
        return "replaced_by_other_device";
      }
    } catch {
      remaining.push(action);
    }
  }

  await writeQueue(remaining);
  return remaining.length === 0 ? "ok" : "queued_offline";
}

export function createSessionIntegrity({ userId, examId, onSessionReplaced }: CreateSessionIntegrityOptions) {
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let stopped = false;
  let inFlight = false;

  const sessionId = buildRandomId("exam_session");

  const sendAction = async (type: SessionActionType) => {
    const deviceId = await getDeviceId();
    const statusAfterFlush = await flushQueuedActions();

    if (statusAfterFlush === "replaced_by_other_device") {
      onSessionReplaced();
      return "replaced_by_other_device" as SessionBackendStatus;
    }

    const action: SessionAction = {
      id: buildRandomId(type),
      type,
      userId,
      examId,
      deviceId,
      sessionId,
      timestamp: Date.now(),
    };

    const status = await postSessionAction(action);

    if (status === "replaced_by_other_device") {
      onSessionReplaced();
    }

    return status;
  };

  const heartbeat = async () => {
    if (inFlight || stopped) {
      return;
    }

    inFlight = true;
    try {
      const status = await sendAction("heartbeat");

      if (status === "skipped" && heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
        stopped = true;
      }
    } finally {
      inFlight = false;
    }
  };

  return {
    async start() {
      const status = await sendAction("start");

      if (stopped || status === "replaced_by_other_device" || status === "skipped") {
        return status;
      }

      heartbeatTimer = setInterval(() => {
        void heartbeat();
      }, HEARTBEAT_INTERVAL_MS);

      return status;
    },

    async stop() {
      stopped = true;

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }

      return sendAction("stop");
    },

    getSessionId() {
      return sessionId;
    },
  };
}
