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
  prefix: string;
  rules: Record<RateLimitKind, RateLimitRule>;
  timeoutMs: number;
};

export const createUpstashRateLimiter = (
  redis: Redis,
  { prefix, rules, timeoutMs }: UpstashRateLimiterOptions,
): RateLimiter => {
  const createLimiter = (kind: RateLimitKind): Ratelimit => {
    const { requests, window } = rules[kind];
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix: `${prefix}:${kind}`,
      timeout: timeoutMs,
    });
  };
  const limiters: Record<RateLimitKind, Ratelimit> = {
    read: createLimiter("read"),
    write: createLimiter("write"),
  };

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
