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
  authenticate: Authenticator;
  rateLimit: RateLimiter;
};

const rateLimitKind = (method: HttpMethod): RateLimitKind => {
  return method === "GET" ? "read" : "write";
};

const secondsUntil = (timestamp: number): number => {
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1000));
};

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
    const requestId = randomUUID();
    response.setHeader("x-request-id", requestId);
    response.setHeader("Cache-Control", "private, no-store");

    return withRequestId(requestId, () => {
      return route(handlers, options, requestId, request, response);
    });
  };
};
