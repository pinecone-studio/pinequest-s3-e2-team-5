export const roleOptions = [
  {
    value: "school",
    label: "School",
    description:
      "Manage your school's teachers, classes, and approvals as the school manager.",
  },
  {
    value: "student",
    label: "Student",
    description: "Join classes, take exams, and track your learning progress.",
  },
  {
    value: "teacher",
    label: "Teacher",
    description: "Create assessments, review results, and manage learners.",
  },
] as const;

export type UserRole = (typeof roleOptions)[number]["value"];

export function isUserRole(value: unknown): value is UserRole {
  return value === "school" || value === "student" || value === "teacher";
}

export function getRoleLabel(role: UserRole) {
  if (role === "school") {
    return "School";
  }

  return role === "teacher" ? "Teacher" : "Student";
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
