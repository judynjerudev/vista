import { Ratelimit } from "@upstash/ratelimit";
import type { Duration } from "@upstash/ratelimit";
import type { Redis } from "@upstash/redis";

import { logError } from "../logger.js";
import type { RateLimitKind, RateLimiter } from "./rateLimiter.js";

export type RateLimitRule = {
  requests: number;
  window: Duration;
};

type UpstashRateLimiterOptions = {
  // Starts every Redis key, so several apps or environments can share one
  // database without sharing counters.
  prefix: string;
  rules: Record<RateLimitKind, RateLimitRule>;
  // How long to wait for Redis before letting the request through.
  timeoutMs: number;
};

export const createUpstashRateLimiter = (
  redis: Redis,
  { prefix, rules, timeoutMs }: UpstashRateLimiterOptions,
): RateLimiter => {
  // Created once per function instance, so the in-memory cache of users
  // who are over their limit is kept between requests.
  const createLimiter = (kind: RateLimitKind): Ratelimit => {
    const { requests, window } = rules[kind];
    return new Ratelimit({
      redis,
      // A sliding window has no reset moment to time a burst around, unlike
      // a fixed window.
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `${prefix}:${kind}`,
      timeout: timeoutMs,
    });
  };
  const limiters: Record<RateLimitKind, Ratelimit> = {
    read: createLimiter("read"),
    write: createLimiter("write"),
  };

  // If Redis is down or slow, the request is allowed: a Redis outage
  // shouldn't take the app down with it. It's logged, so it doesn't go
  // unnoticed.
  return async (kind, key) => {
    try {
      const { success, limit, remaining, reset, reason } =
        await limiters[kind].limit(key);
      if (reason === "timeout") {
        logError(
          `Rate limit check timed out after ${timeoutMs}ms; allowing the request`,
        );
        return null;
      }
      return { allowed: success, limit, remaining, resetAt: reset };
    } catch (error) {
      logError("Rate limit check failed; allowing the request:", error);
      return null;
    }
  };
};
