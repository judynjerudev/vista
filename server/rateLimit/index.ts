import { Redis } from "@upstash/redis";

import { serverConfig } from "../serverConfig.js";
import { noRateLimit } from "./rateLimiter.js";
import type { RateLimitKind, RateLimiter } from "./rateLimiter.js";
import { createUpstashRateLimiter } from "./upstashRateLimiter.js";
import type { RateLimitRule } from "./upstashRateLimiter.js";

export type { RateLimitKind, RateLimiter } from "./rateLimiter.js";

export const rateLimitRules: Record<RateLimitKind, RateLimitRule> = {
  read: { requests: 120, window: "1 m" },
  write: { requests: 30, window: "1 m" },
};

const createRateLimiter = (): RateLimiter => {
  const { redis, environment } = serverConfig;
  if (!redis) {
    console.warn(
      "Rate limiting is off: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set",
    );
    return noRateLimit;
  }

  return createUpstashRateLimiter(new Redis(redis), {
    prefix: `vista:${environment}:ratelimit`,
    rules: rateLimitRules,
    timeoutMs: 1000,
  });
};

export const rateLimit = createRateLimiter();
