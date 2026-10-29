import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { notFound } from "../errors.js";
import { logError } from "../logger.js";
import { methodRouter } from "./handler.js";
import { parseBody } from "./request.js";
import { sendJson } from "./responses.js";
import { callHandler as call } from "./testing.js";

describe("methodRouter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs the handler for the method and tags the response with a request ID", async () => {
    const router = methodRouter({
      GET: async (_, response) => {
        sendJson(response, 200, { ok: true });
      },
    });

    const response = await call(router, { method: "GET" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ ok: true });
    expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects an unsupported method with the allowed ones", async () => {
    const router = methodRouter({ GET: vi.fn(), POST: vi.fn() });

    const response = await call(router, { method: "PATCH" });

    expect(response.statusCode).toBe(405);
    expect(response.headers.allow).toBe("GET, POST");
    expect(response.body).toEqual({
      error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed" },
    });
  });

  it("returns validation errors with per-field details", async () => {
    const router = methodRouter({
      POST: async (request) => {
        parseBody(request, z.object({ name: z.string().min(1, "Required") }));
      },
    });

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
    const router = methodRouter({
      GET: async () => {
        throw notFound("Project");
      },
    });

    const response = await call(router, { method: "GET" });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({
      error: { code: "NOT_FOUND", message: "Project not found" },
    });
  });

  it("hides unexpected errors and logs them with the request ID", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const router = methodRouter({
      GET: async () => {
        logError("Looking something up");
        throw new Error("database password is wrong");
      },
    });

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
});
