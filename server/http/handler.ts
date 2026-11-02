import { randomUUID } from "node:crypto";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import type { AuthUser, Authenticator } from "../auth/authenticate.js";
import { AppError } from "../errors.js";
import { withRequestId } from "../logger.js";
import type {
  RateLimitKind,
  RateLimitResult,
  RateLimiter,
} from "../rateLimit/rateLimiter.js";
import { sendError } from "./responses.js";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestContext = {
  requestId: string;
  user: AuthUser;
};

export type RouteHandler = (
  request: VercelRequest,
  response: VercelResponse,
  context: RequestContext,
) => Promise<void>;

type RouteHandlers = Partial<Record<HttpMethod, RouteHandler>>;

type RouterOptions = {
  // Both required, so a new route can't forget to authenticate or
  // rate-limit its callers.
  authenticate: Authenticator;
  rateLimit: RateLimiter;
};

const rateLimitKind = (method: HttpMethod): RateLimitKind => {
  return method === "GET" ? "read" : "write";
};

const secondsUntil = (timestamp: number): number => {
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
};

// The RateLimit-* headers from the IETF draft that most APIs send, so
// clients can slow down before they hit the limit.
const setRateLimitHeaders = (
  response: VercelResponse,
  { limit, remaining, resetAt }: RateLimitResult,
): void => {
  response.setHeader("RateLimit-Limit", String(limit));
  response.setHeader("RateLimit-Remaining", String(remaining));
  response.setHeader("RateLimit-Reset", String(secondsUntil(resetAt)));
};

const enforceRateLimit = async (
  rateLimit: RateLimiter,
  method: HttpMethod,
  user: AuthUser,
  response: VercelResponse,
): Promise<void> => {
  const result = await rateLimit(rateLimitKind(method), user.uid);
  if (!result) {
    return;
  }

  setRateLimitHeaders(response, result);
  if (!result.allowed) {
    const retryAfter = Math.max(1, secondsUntil(result.resetAt));
    response.setHeader("Retry-After", String(retryAfter));
    throw new AppError(
      "RATE_LIMITED",
      `Too many requests. Try again in ${retryAfter} ${retryAfter === 1 ? "second" : "seconds"}.`,
    );
  }
};

const route = async (
  handlers: RouteHandlers,
  options: RouterOptions,
  requestId: string,
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> => {
  const method = request.method as HttpMethod;
  const handle = handlers[method];

  if (!handle) {
    response.setHeader("Allow", Object.keys(handlers).join(", "));
    sendError(
      response,
      new AppError("METHOD_NOT_ALLOWED", "Method not allowed"),
    );
    return;
  }

  try {
    // After authentication, so limits are per user, and requests without a
    // valid token are turned away before they reach Redis.
    const user = await options.authenticate(request);
    await enforceRateLimit(options.rateLimit, method, user, response);
    await handle(request, response, { requestId, user });
  } catch (error) {
    sendError(response, error);
  }
};

export const methodRouter = (
  handlers: RouteHandlers,
  options: RouterOptions,
) => {
  return (request: VercelRequest, response: VercelResponse): Promise<void> => {
    // Sent back to the client and tagged on every log line, so a reported
    // failure can be matched to its logs.
    const requestId = randomUUID();
    response.setHeader("x-request-id", requestId);
    // Every response is one user's private data, or an error about their
    // request: browsers and shared caches (CDNs, proxies) must not keep it.
    // The app caches data itself, in memory, and clears it on sign-out.
    response.setHeader("Cache-Control", "private, no-store");

    return withRequestId(requestId, () => {
      return route(handlers, options, requestId, request, response);
    });
  };
};
