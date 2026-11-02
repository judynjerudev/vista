import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { AuthUser } from "../auth/authenticate.js";
import { AppError, notFound } from "../errors.js";
import { logError } from "../logger.js";
import { noRateLimit } from "../rateLimit/rateLimiter.js";
import type { RateLimiter } from "../rateLimit/rateLimiter.js";
import { methodRouter } from "./handler.js";
import { parseBody } from "./request.js";
import { sendJson } from "./responses.js";
import { callHandler as call } from "./testing.js";

const signedInUser: AuthUser = { uid: "user-1", email: "user@example.com" };

const options = {
  authenticate: async (): Promise<AuthUser> => {
    return signedInUser;
  },
  rateLimit: noRateLimit,
};

const limitedTo = (result: Awaited<ReturnType<RateLimiter>>): RateLimiter => {
  return vi.fn(async () => {
    return result;
  });
};

describe("methodRouter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs the handler for the method and tags the response with a request ID", async () => {
    const router = methodRouter(
      {
        GET: async (_, response) => {
          sendJson(response, 200, { ok: true });
        },
      },
      options,
    );

    const response = await call(router, { method: "GET" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects an unsupported method with the allowed ones", async () => {
    const router = methodRouter({ GET: vi.fn(), POST: vi.fn() }, options);

    const response = await call(router, { method: "PATCH" });

    expect(response.statusCode).toBe(405);
    expect(response.headers.allow).toBe("GET, POST");
    expect(response.body).toEqual({
      error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
    });
  });

  it("returns validation errors with per-field details", async () => {
    const router = methodRouter(
      {
        POST: async (request) => {
          parseBody(request, z.object({ name: z.string().min(1, "Required") }));
        },
      },
      options,
    );

    const response = await call(router, { method: "POST", body: { name: "" } });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_FAILED",
        message: "name: Required",
        details: [{ path: "name", message: "Required" }],
      },
    });
  });

  it("maps domain errors to their status code", async () => {
    const router = methodRouter(
      {
        GET: async () => {
          throw notFound("Project");
        },
      },
      options,
    );

    const response = await call(router, { method: "GET" });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Project not found" },
    });
  });

  it("hides unexpected errors and logs them with the request ID", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const router = methodRouter(
      {
        GET: async () => {
          logError("Looking something up");
          throw new Error("database password is wrong");
        },
      },
      options,
    );

    const response = await call(router, { method: "GET" });
    const requestId = response.headers["x-request-id"];

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({
      error: { code: "INTERNAL", message: "Internal server error" },
    });
    expect(log).toHaveBeenNthCalledWith(
      1,
      `[request ${requestId}] Looking something up`,
    );
    expect(log).toHaveBeenNthCalledWith(
      2,
      `[request ${requestId}] Unhandled error:`,
      expect.any(Error),
    );
  });

  it("passes the signed-in user and request ID to the handler", async () => {
    const handler = vi.fn(async () => {});
    const router = methodRouter({ GET: handler }, options);

    const response = await call(router, { method: "GET" });

    expect(handler).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
      requestId: response.headers["x-request-id"],
      user: signedInUser,
    });
  });

  it("rejects an unauthenticated request before running the handler", async () => {
    const handler = vi.fn(async () => {});
    const router = methodRouter(
      { GET: handler },
      {
        ...options,
        authenticate: async () => {
          throw new AppError("UNAUTHENTICATED", "Sign in required");
        },
      },
    );

    const response = await call(router, { method: "GET" });

    expect(handler).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(401);
    expect(response.headers["www-authenticate"]).toBe("Bearer");
    expect(response.body).toEqual({
      error: { code: "UNAUTHENTICATED", message: "Sign in required" },
    });
  });

  it("counts reads and writes against the signed-in user", async () => {
    const rateLimit = limitedTo(null);
    const router = methodRouter(
      { GET: vi.fn(), POST: vi.fn() },
      { ...options, rateLimit },
    );

    await call(router, { method: "GET" });
    await call(router, { method: "POST" });

    expect(rateLimit).toHaveBeenNthCalledWith(1, "read", "user-1");
    expect(rateLimit).toHaveBeenNthCalledWith(2, "write", "user-1");
  });

  it("sends the rate limit headers with an allowed request", async () => {
    const router = methodRouter(
      {
        GET: async (_, response) => {
          sendJson(response, 200, { ok: true });
        },
      },
      {
        ...options,
        rateLimit: limitedTo({
          allowed: true,
          limit: 120,
          remaining: 119,
          resetAt: Date.now() + 30_000,
        }),
      },
    );

    const response = await call(router, { method: "GET" });

    expect(response.statusCode).toBe(200);
    expect(response.headers).toMatchObject({
      "ratelimit-limit": "120",
      "ratelimit-remaining": "119",
      "ratelimit-reset": "30",
    });
    expect(response.headers["retry-after"]).toBeUndefined();
  });

  it("rejects a request over the limit with 429 and when to retry", async () => {
    const handler = vi.fn(async () => {});
    const router = methodRouter(
      { POST: handler },
      {
        ...options,
        rateLimit: limitedTo({
          allowed: false,
          limit: 30,
          remaining: 0,
          resetAt: Date.now() + 12_000,
        }),
      },
    );

    const response = await call(router, { method: "POST" });

    expect(handler).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(429);
    expect(response.headers).toMatchObject({
      "retry-after": "12",
      "ratelimit-limit": "30",
      "ratelimit-remaining": "0",
      "ratelimit-reset": "12",
    });
    expect(response.body).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Try again in 12 seconds.",
      },
    });
  });

  it("asks a client to wait at least a second, even as the window resets", async () => {
    const router = methodRouter(
      { POST: vi.fn() },
      {
        ...options,
        rateLimit: limitedTo({
          allowed: false,
          limit: 30,
          remaining: 0,
          resetAt: Date.now(),
        }),
      },
    );

    const response = await call(router, { method: "POST" });

    expect(response.headers["retry-after"]).toBe("1");
    expect(response.body).toMatchObject({
      error: { message: "Too many requests. Try again in 1 second." },
    });
  });

  it("sends no rate limit headers when the limiter makes no decision", async () => {
    const router = methodRouter({ GET: vi.fn() }, options);

    const response = await call(router, { method: "GET" });

    expect(Object.keys(response.headers)).toEqual(["x-request-id"]);
  });

  it("doesn't count requests that fail authentication", async () => {
    const rateLimit = limitedTo(null);
    const router = methodRouter(
      { GET: vi.fn() },
      {
        authenticate: async () => {
          throw new AppError("UNAUTHENTICATED", "Sign in required");
        },
        rateLimit,
      },
    );

    await call(router, { method: "GET" });

    expect(rateLimit).not.toHaveBeenCalled();
  });
});
