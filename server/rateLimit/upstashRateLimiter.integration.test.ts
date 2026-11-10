import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import type { Server, ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

import { Redis } from "@upstash/redis";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { RateLimitKind } from "./rateLimiter.js";
import { createUpstashRateLimiter } from "./upstashRateLimiter.js";
import type { RateLimitRule } from "./upstashRateLimiter.js";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
});

const rules: Record<RateLimitKind, RateLimitRule> = {
  read: { requests: 3, window: "1 m" },
  write: { requests: 1, window: "1 m" },
};

const createLimiter = (store = redis, timeoutMs = 1000) => {
  return createUpstashRateLimiter(store, {
    prefix: `vista:test:${randomUUID()}`,
    rules,
    timeoutMs,
  });
};

const startFakeRedis = async (
  respond: (response: ServerResponse) => void,
): Promise<{ store: Redis; server: Server }> => {
  const server = createServer((_, response) => {
    respond(response);
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address() as AddressInfo;
  const store = new Redis({
    url: `http://127.0.0.1:${port}`,
    token: "unused",
    retry: false,
  });
  return { store, server };
};

describe("createUpstashRateLimiter", () => {
  let server: Server | undefined;

  afterEach(() => {
    vi.restoreAllMocks();
    server?.closeAllConnections();
    server?.close();
    server = undefined;
  });

  it("allows requests up to the limit, then blocks until the window resets", async () => {
    const limit = createLimiter();
    const before = Date.now();

    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await limit("read", "user-1"));
    }

    expect(
      results.map((result) => {
        return [result?.allowed, result?.remaining];
      }),
    ).toEqual([
      [true, 2],
      [true, 1],
      [true, 0],
      [false, 0],
    ]);
    expect(results[3]?.limit).toBe(3);
    expect(results[3]?.resetAt).toBeGreaterThan(before);
    expect(results[3]?.resetAt).toBeLessThanOrEqual(Date.now() + 60_000);
  });

  it("counts each user separately", async () => {
    const limit = createLimiter();

    expect((await limit("write", "user-1"))?.allowed).toBe(true);
    expect((await limit("write", "user-1"))?.allowed).toBe(false);
    expect((await limit("write", "user-2"))?.allowed).toBe(true);
  });

  it("counts reads and writes separately", async () => {
    const limit = createLimiter();

    expect((await limit("write", "user-1"))?.allowed).toBe(true);
    expect((await limit("write", "user-1"))?.allowed).toBe(false);
    expect((await limit("read", "user-1"))?.allowed).toBe(true);
  });

  it("allows the request and logs when Redis doesn't answer in time", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = await startFakeRedis(() => {});
    server = fake.server;

    const result = await createLimiter(fake.store, 100)("read", "user-1");

    expect(result).toBeNull();
    expect(log).toHaveBeenCalledWith(
      "Rate limit check timed out after 100ms; allowing the request",
    );
  });

  it("allows the request and logs when Redis fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = await startFakeRedis((response) => {
      response.writeHead(500, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: "ERR something broke" }));
    });
    server = fake.server;

    const result = await createLimiter(fake.store, 5000)("read", "user-1");

    expect(result).toBeNull();
    expect(log).toHaveBeenCalledWith(
      "Rate limit check failed; allowing the request:",
      expect.any(Error),
    );
  });
});
