import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import type { Exam, StudentProfile, Submission } from "@/data/types";

type StoredLocalSubmissions = {
  version: 1;
  submissions: Submission[];
  updatedAt: number;
};

type StoredRemoteSnapshot = {
  version: 1;
  student: StudentProfile;
  availableExams: Exam[];
  scheduledExams?: Exam[];
  submissions: Submission[];
  updatedAt: number;
};

const LOCAL_SUBMISSIONS_KEY = "pinequest.local-submissions.v1";
const REMOTE_SNAPSHOT_KEY = "pinequest.remote-snapshot.v1";

let storageBackend: "unknown" | "async" | "secure" = "unknown";

async function getStoredValue(key: string) {
  if (storageBackend !== "secure") {
    try {
      const value = await AsyncStorage.getItem(key);
      storageBackend = "async";
      return value;
    } catch {
      storageBackend = "secure";
    }
  }

  return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string) {
  if (storageBackend !== "secure") {
    try {
      await AsyncStorage.setItem(key, value);
      storageBackend = "async";
      return;
    } catch {
      storageBackend = "secure";
    }
  }

  await SecureStore.setItemAsync(key, value);
}

async function removeStoredValue(key: string) {
  if (storageBackend !== "secure") {
    try {
      await AsyncStorage.removeItem(key);
      storageBackend = "async";
      return;
    } catch {
      storageBackend = "secure";
    }
  }

  await SecureStore.deleteItemAsync(key);
}

function isSubmissionArray(value: unknown): value is Submission[] {
  return Array.isArray(value);
}

function isExamArray(value: unknown): value is Exam[] {
  return Array.isArray(value);
}

function isStudentProfile(value: unknown): value is StudentProfile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const student = value as StudentProfile;

  return (
    typeof student.id === "string" &&
    typeof student.fullName === "string" &&
    typeof student.firstName === "string" &&
    typeof student.lastName === "string" &&
    typeof student.email === "string" &&
    student.role === "student" &&
    typeof student.phone === "string" &&
    typeof student.grade === "string" &&
    typeof student.className === "string" &&
    typeof student.inviteCode === "string"
  );
}

export async function loadLocalSubmissions() {
  const raw = await getStoredValue(LOCAL_SUBMISSIONS_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredLocalSubmissions;

    if (parsed.version !== 1 || !isSubmissionArray(parsed.submissions)) {
      return null;
    }

    return parsed.submissions;
  } catch {
    return null;
  }
}

export async function saveLocalSubmissions(submissions: Submission[]) {
  const payload: StoredLocalSubmissions = {
    version: 1,
    submissions,
    updatedAt: Date.now(),
  };

  await setStoredValue(LOCAL_SUBMISSIONS_KEY, JSON.stringify(payload));
}

export async function clearLocalSubmissions() {
  await removeStoredValue(LOCAL_SUBMISSIONS_KEY);
}

export async function loadRemoteSnapshot() {
  const raw = await getStoredValue(REMOTE_SNAPSHOT_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredRemoteSnapshot;

    if (
      parsed.version !== 1 ||
      !isStudentProfile(parsed.student) ||
      !isExamArray(parsed.availableExams) ||
      !isSubmissionArray(parsed.submissions)
    ) {
      return null;
    }

    return {
      student: parsed.student,
      availableExams: parsed.availableExams,
      scheduledExams: parsed.scheduledExams ?? [],
      submissions: parsed.submissions,
    };
  } catch {
    return null;
  }
}

export async function saveRemoteSnapshot(snapshot: {
  student: StudentProfile;
  availableExams: Exam[];
  scheduledExams: Exam[];
  submissions: Submission[];
}) {
  const payload: StoredRemoteSnapshot = {
    version: 1,
    student: snapshot.student,
    availableExams: snapshot.availableExams,
    scheduledExams: snapshot.scheduledExams,
    submissions: snapshot.submissions,
    updatedAt: Date.now(),
  };

  await setStoredValue(REMOTE_SNAPSHOT_KEY, JSON.stringify(payload));
}

export async function clearRemoteSnapshot() {
  await removeStoredValue(REMOTE_SNAPSHOT_KEY);
}
