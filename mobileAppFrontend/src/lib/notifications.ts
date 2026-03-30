import * as Notifications from "expo-notifications";
import { getStudentExamPresentation } from "@/lib/student-exam";

type ReminderState = {
  identifier: string;
  reminderDate: Date;
} | null;

const REMINDER_MINUTES_BEFORE = 15;

function hasNotificationPermission(status: Notifications.NotificationPermissionsStatus) {
  return (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export function getExamStartDate(scheduledDate?: string | null, startTime?: string | null) {
  if (!scheduledDate || !startTime) {
    return null;
  }

  const [year, month, day] = scheduledDate.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);

  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function getExamReminderDate(scheduledDate?: string | null, startTime?: string | null) {
  const startDate = getExamStartDate(scheduledDate, startTime);
  if (!startDate) {
    return null;
  }

  return new Date(startDate.getTime() - REMINDER_MINUTES_BEFORE * 60 * 1000);
}

export function formatReminderDate(date: Date) {
  return new Intl.DateTimeFormat("mn-MN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function ensureExamReminderPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (hasNotificationPermission(current)) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return hasNotificationPermission(requested);
}

export async function getExamReminder(examId: string): Promise<ReminderState> {
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  const request = requests.find(
    (item) =>
      item.content.data &&
      typeof item.content.data.examId === "string" &&
      item.content.data.examId === examId,
  );

  if (!request) {
    return null;
  }

  const reminderDate = (() => {
    if (
      request.content.data &&
      typeof request.content.data.reminderAt === "number" &&
      Number.isFinite(request.content.data.reminderAt)
    ) {
      return new Date(request.content.data.reminderAt);
    }
    return null;
  })();

  if (!reminderDate) {
    return null;
  }

  return {
    identifier: request.identifier,
    reminderDate,
  };
}

export async function cancelExamReminder(examId: string) {
  const reminder = await getExamReminder(examId);

  if (reminder) {
    await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
  }
}

export async function scheduleExamReminder({
  examId,
  title,
  subject,
  scheduledDate,
  startTime,
}: {
  examId: string;
  title: string;
  subject: string;
  scheduledDate?: string | null;
  startTime?: string | null;
}) {
  const reminderDate = getExamReminderDate(scheduledDate, startTime);
  if (!reminderDate) {
    throw new Error("Шалгалтын тов тодорхойгүй тул reminder тохируулах боломжгүй байна.");
  }

  if (reminderDate.getTime() <= Date.now()) {
    throw new Error("Reminder тавихад хэтэрхий оройтсон байна.");
  }

  const permissionGranted = await ensureExamReminderPermission();
  if (!permissionGranted) {
    throw new Error("Notification permission зөвшөөрөгдөөгүй байна.");
  }

  await cancelExamReminder(examId);

  const subjectLabel = getStudentExamPresentation(subject).subjectLabel;
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: `${subjectLabel} шалгалт эхлэх гэж байна`,
      body: `${title} шалгалт ${REMINDER_MINUTES_BEFORE} минутын дараа эхэлнэ.`,
      sound: true,
      data: {
        type: "exam-reminder",
        examId,
        reminderAt: reminderDate.getTime(),
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  return {
    identifier,
    reminderDate,
  };
}
