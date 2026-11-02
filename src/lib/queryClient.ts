import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./http";

const maxRetries = 2;

// Retrying only helps when a failure might be temporary: the network, or a
// server error. A 4xx answer (signed out, not found, invalid, rate limited)
// would fail again, and retrying a 429 would only use up more of the limit.
export const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (error instanceof ApiError && error.status < 500) {
    return false;
  }
  return failureCount < maxRetries;
};

export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Fetched data counts as fresh for 30 seconds. Within that time,
        // switching pages shows it from the cache without asking the API.
        // After it, the cache is shown at once and refreshed in the
        // background.
        staleTime: 30_000,
        retry: shouldRetry,
      },
    },
  });
};
