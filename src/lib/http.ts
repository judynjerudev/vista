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

type TokenProvider = () => Promise<string | null>;

const noToken: TokenProvider = async () => {
  return null;
};
const ignoreUnauthorized = (): void => {};

let getToken = noToken;
let onUnauthorized = ignoreUnauthorized;

// Registered by the auth feature, so `lib/` never imports a feature. Each
// returns a function that unregisters it, unless something newer replaced it.
export const setTokenProvider = (provider: TokenProvider): (() => void) => {
  getToken = provider;
  return () => {
    if (getToken === provider) {
      getToken = noToken;
    }
  };
};

export const setUnauthorizedHandler = (handler: () => void): (() => void) => {
  onUnauthorized = handler;
  return () => {
    if (onUnauthorized === handler) {
      onUnauthorized = ignoreUnauthorized;
    }
  };
};

export const http = async <T>(
  path: string,
  options?: RequestInit,
): Promise<T> => {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");

  const token = await getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });

  if (!response.ok) {
    const error = await toApiError(response);
    if (error.code === "UNAUTHENTICATED") {
      onUnauthorized();
    }
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
};
