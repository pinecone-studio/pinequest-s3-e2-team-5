export const roleOptions = [
  {
    value: "student",
    label: "Сурагч",
    description: "Join classes, take exams, and track your learning progress.",
  },
  {
    value: "teacher",
    label: "Багш",
    description: "Create assessments, review results, and manage learners.",
  },
] as const;

export type UserRole = (typeof roleOptions)[number]["value"];

export function isUserRole(value: unknown): value is UserRole {
  return value === "school" || value === "student" || value === "teacher";
}

export function getRoleLabel(role: UserRole) {
  return role === "teacher" ? "Багш" : "Сурагч";
}

export function getRoleHomePath(role: UserRole) {
  if (role === "student") {
    return "/student";
  }

  if (role === "teacher") {
    return "/teacher";
  }

  return "/dashboard";
}
