export function getClerkErrorMessage(error: unknown) {
  if (Array.isArray(error)) {
    return getClerkErrorMessage(error[0]);
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray(error.errors)
  ) {
    return getClerkErrorMessage(error.errors[0]);
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "longMessage" in error &&
    typeof error.longMessage === "string"
  ) {
    return error.longMessage;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Алдаа гарлаа. Дахин оролдоно уу.";
}
