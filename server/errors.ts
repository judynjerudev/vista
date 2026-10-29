import type { ErrorCode } from "../shared/http/errors.js";

// Says *what* went wrong; the HTTP layer decides which status code that is.
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (resource: string): AppError => {
  return new AppError("NOT_FOUND", `${resource} not found`);
};
