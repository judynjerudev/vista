// @vitest-environment jsdom
import type { ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { cleanup, render, renderHook, screen } from "@testing-library/react";
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

const Projects = () => {
  const { data } = useQuery({
    queryKey: key,
    queryFn: () => {
      return Promise.resolve(["user-2's project"]);
    },
  });
  return <p>{data ? data.join(", ") : "Loading projects..."}</p>;
};

const App = ({ userId }: { userId: string | null }) => {
  useClearCacheOnUserChange(userId);
  return userId ? <Projects /> : null;
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

  it("keeps the cache when a user signs in after nobody was signed in", () => {
    const { rerender } = renderForUser(null);

    rerender({ userId: "user-1" });

    expect(queryClient.getQueryData(key)).toEqual(["user-1's project"]);
  });

  it("loads the data of a page that opens as the user signs in", async () => {
    queryClient.clear();
    const { rerender } = render(<App userId={null} />, { wrapper });

    rerender(<App userId="user-2" />);

    expect(await screen.findByText("user-2's project")).toBeDefined();
  });
});
