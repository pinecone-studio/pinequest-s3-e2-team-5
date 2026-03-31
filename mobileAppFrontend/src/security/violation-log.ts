import * as SecureStore from "expo-secure-store";
import type { ViolationLog, ViolationType } from "@/security/types";

const VIOLATION_LOGS_KEY = "pinequest_violation_logs";

function buildViolationId(examId: string, type: ViolationType, timestamp: number) {
  const safeExamId = examId.replace(/[^A-Za-z0-9._-]/g, "_") || "exam";
  return `${safeExamId}_${type}_${timestamp}`;
}

async function readLogs() {
  const raw = await SecureStore.getItemAsync(VIOLATION_LOGS_KEY);

  if (!raw) {
    return [] as ViolationLog[];
  }

  try {
    const parsed = JSON.parse(raw) as ViolationLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLogs(logs: ViolationLog[]) {
  await SecureStore.setItemAsync(VIOLATION_LOGS_KEY, JSON.stringify(logs));
}

export async function appendViolationLog(input: {
  userId: string;
  examId: string;
  timestamp?: number;
  type: ViolationType;
  duration?: number;
}) {
  const timestamp = input.timestamp ?? Date.now();
  const nextLog: ViolationLog = {
    id: buildViolationId(input.examId, input.type, timestamp),
    userId: input.userId,
    examId: input.examId,
    timestamp,
    type: input.type,
    duration: input.duration ?? 0,
  };

  const current = await readLogs();
  const next = [nextLog, ...current].slice(0, 500);
  await writeLogs(next);
  return nextLog;
}

export async function listViolationLogsForExam(userId: string, examId: string) {
  const current = await readLogs();
  return current.filter((log) => log.userId === userId && log.examId === examId);
}

export async function clearViolationLogsForExam(userId: string, examId: string) {
  const current = await readLogs();
  const next = current.filter((log) => !(log.userId === userId && log.examId === examId));
  await writeLogs(next);
}
