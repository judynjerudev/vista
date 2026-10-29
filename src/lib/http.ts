import type { ErrorCode, ErrorDetail } from "@shared/http/errors";
import { isErrorResponse } from "@shared/http/errors";

export class ApiError extends Error {
  status: number;
  code: ErrorCode;
  details: ErrorDetail[];
  requestId: string | null;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    options: { details?: ErrorDetail[]; requestId?: string | null } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = options.details ?? [];
    this.requestId = options.requestId ?? null;
  }
}

const toApiError = async (response: Response): Promise<ApiError> => {
  const requestId = response.headers.get("x-request-id");
  const body: unknown = await response.json().catch(() => {
    return null;
  });

  if (isErrorResponse(body)) {
    const { code, message, details } = body.error;
    return new ApiError(response.status, code, message, {
      details,
      requestId,
    });
  }

  // Not one of our error responses, e.g. the platform failing before the
  // function ran.
  return new ApiError(
    response.status,
    "INTERNAL",
    response.statusText || "Request failed",
    { requestId },
  );
};

export const http = async <T>(
  path: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};
