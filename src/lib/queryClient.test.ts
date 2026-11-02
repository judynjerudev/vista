import { describe, expect, it } from "vitest";

import { ApiError } from "./http";
import { createQueryClient, shouldRetry } from "./queryClient";

describe("shouldRetry", () => {
  it.each([
    [401, "UNAUTHENTICATED"],
    [404, "NOT_FOUND"],
    [429, "RATE_LIMITED"],
  ] as const)("doesn't retry a %i", (status, code) => {
    expect(shouldRetry(0, new ApiError(status, code, "Failed"))).toBe(false);
  });

  it("retries a server error twice", () => {
    const error = new ApiError(500, "INTERNAL", "Internal server error");

    expect(shouldRetry(0, error)).toBe(true);
    expect(shouldRetry(1, error)).toBe(true);
    expect(shouldRetry(2, error)).toBe(false);
  });

  it("retries a network failure", () => {
    expect(shouldRetry(0, new TypeError("Failed to fetch"))).toBe(true);
  });
});

describe("createQueryClient", () => {
  it("uses the retry rule and keeps data fresh for 30 seconds", () => {
    const { queries } = createQueryClient().getDefaultOptions();

    expect(queries?.retry).toBe(shouldRetry);
    expect(queries?.staleTime).toBe(30_000);
  });
});
