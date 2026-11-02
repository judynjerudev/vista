// Reads and writes are limited separately, so someone browsing quickly
// doesn't use up the allowance for saving their work.
export type RateLimitKind = "read" | "write";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  // When the current window resets, as a Unix timestamp in milliseconds.
  resetAt: number;
};

// Counts one request for `key` (a user ID). `null` means no decision was
// made, because rate limiting is off or the store didn't answer, so the
// request goes ahead.
export type RateLimiter = (
  kind: RateLimitKind,
  key: string,
) => Promise<RateLimitResult | null>;

export const noRateLimit: RateLimiter = async () => {
  return null;
};
