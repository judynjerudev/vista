import { MutationObserver, onlineManager } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it("uses the retry rule and keeps data fresh for 30 seconds", () => {
    const { queries } = createQueryClient().getDefaultOptions();

    expect(queries?.retry).toBe(shouldRetry);
    expect(queries?.staleTime).toBe(30_000);
  });

  it("sends a save while offline, so it fails instead of waiting", async () => {
    onlineManager.setOnline(false);
    const mutationFn = vi
      .fn()
      .mockRejectedValue(new TypeError("Failed to fetch"));
    const observer = new MutationObserver(createQueryClient(), { mutationFn });

    await expect(observer.mutate(undefined)).rejects.toThrow("Failed to fetch");
    expect(mutationFn).toHaveBeenCalledOnce();
  });
});
