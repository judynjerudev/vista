export type RateLimitKind = "read" | "write";

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

export type RateLimiter = (
  kind: RateLimitKind,
  key: string,
) => Promise<RateLimitResult | null>;

export const noRateLimit: RateLimiter = async () => {
  return null;
};
