import type { VercelResponse } from "@vercel/node";

import type { ErrorCode } from "../../shared/http/errors.js";
import { AppError } from "../errors.js";

const statusByCode: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL: 500,
};

export const sendError = (res: VercelResponse, error: unknown): void => {
  if (error instanceof AppError) {
    res.status(statusByCode[error.code]).json({ error: error.message });
    return;
  }

  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
};
