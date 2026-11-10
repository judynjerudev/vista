import { QueryClient } from "@tanstack/react-query";

import { ApiError } from "./http";

const maxRetries = 2;

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
        staleTime: 30_000,
        retry: shouldRetry,
      },
    },
  });
};
