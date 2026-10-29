export const errorCodes = [
  "VALIDATION_FAILED",
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "METHOD_NOT_ALLOWED",
  "INTERNAL",
] as const;
export type ErrorCode = (typeof errorCodes)[number];

export type ErrorDetail = {
  path: string;
  message: string;
};

// The body of every error response from the API.
export type ErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
    details?: ErrorDetail[];
  };
};

export const isErrorResponse = (body: unknown): body is ErrorResponse => {
  if (typeof body !== "object" || body === null || !("error" in body)) {
    return false;
  }
  const { error } = body;
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    errorCodes.includes(error.code as ErrorCode) &&
    typeof error.message === "string"
  );
};
