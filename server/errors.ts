import type { ErrorCode, ErrorDetail } from "../shared/http/errors.js";

// Says *what* went wrong; the HTTP layer decides which status code that is.
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (resource: string): AppError => {
  return new AppError("NOT_FOUND", `${resource} not found`);
};

export const validationFailed = (details: ErrorDetail[]): AppError => {
  const message = details
    .map((detail) => {
      return `${detail.path}: ${detail.message}`;
    })
    .join("; ");
  return new AppError("VALIDATION_FAILED", message, details);
};
