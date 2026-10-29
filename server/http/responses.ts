import type { VercelResponse } from "@vercel/node";

import type { ErrorCode, ErrorResponse } from "../../shared/http/errors.js";
import { AppError } from "../errors.js";
import { logError } from "../logger.js";

const statusByCode: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL: 500,
};

export const sendJson = (
  res: VercelResponse,
  status: number,
  body: unknown,
): void => {
  res.status(status).json(body);
};

export const sendNoContent = (res: VercelResponse): void => {
  res.status(204).end();
};

const toErrorResponse = (error: AppError): ErrorResponse => {
  const { code, message, details } = error;
  return { error: { code, message, ...(details && { details }) } };
};

export const sendError = (res: VercelResponse, error: unknown): void => {
  if (error instanceof AppError) {
    if (error.code === "UNAUTHENTICATED") {
      res.setHeader("WWW-Authenticate", "Bearer");
    }
    res.status(statusByCode[error.code]).json(toErrorResponse(error));
    return;
  }

  // Unexpected errors are logged in full but never sent to the client.
  logError("Unhandled error:", error);
  res
    .status(500)
    .json(toErrorResponse(new AppError("INTERNAL", "Internal server error")));
};
