// @vitest-environment jsdom
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useClearCacheOnUserChange } from "./useClearCacheOnUserChange";

const key = ["projects", "list"];

let queryClient: QueryClient;

const wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const renderForUser = (userId: string | null) => {
  return renderHook(
    (props: { userId: string | null }) => {
      useClearCacheOnUserChange(props.userId);
    },
    { wrapper, initialProps: { userId } },
  );
};

describe("useClearCacheOnUserChange", () => {
  beforeEach(() => {
    queryClient = new QueryClient();
    queryClient.setQueryData(key, ["user-1's project"]);
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the cache while the same user stays signed in", () => {
    const { rerender } = renderForUser("user-1");

    rerender({ userId: "user-1" });

    expect(queryClient.getQueryData(key)).toEqual(["user-1's project"]);
  });

  it("clears the cache on sign-out", () => {
    const { rerender } = renderForUser("user-1");

    rerender({ userId: null });

    expect(queryClient.getQueryData(key)).toBeUndefined();
  });

  it("clears the cache when a different user signs in", () => {
    const { rerender } = renderForUser("user-1");

    rerender({ userId: "user-2" });

    expect(queryClient.getQueryData(key)).toBeUndefined();
  });
});
