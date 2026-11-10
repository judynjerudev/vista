// @vitest-environment jsdom
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "@shared/projects/model";

import { ApiError } from "@/lib/http";
import { projectsApi } from "./api";
import {
  projectKeys,
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "./hooks";

vi.mock("./api", () => {
  return {
    projectsApi: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
});

const buildProject = (overrides: Partial<Project>): Project => {
  return {
    uuid: "project",
    name: "Project",
    description: "Description",
    status: "ACTIVE",
    priority: "MEDIUM",
    ownerUuid: "owner",
    dueDate: null,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
};

const launch = buildProject({ uuid: "launch", name: "Launch" });
const audit = buildProject({ uuid: "audit", name: "Audit" });

let queryClient: QueryClient;

const wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const renderWithList = <T,>(useHook: () => T) => {
  return renderHook(
    () => {
      return { list: useProjects(), hook: useHook() };
    },
    { wrapper },
  );
};

describe("project hooks", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    vi.mocked(projectsApi.list).mockResolvedValue([launch, audit]);
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    vi.resetAllMocks();
  });

  it("loads the projects", async () => {
    const { result } = renderHook(useProjects, { wrapper });

    expect(result.current).toEqual({
      projects: [],
      loading: true,
      error: null,
    });
    await waitFor(() => {
      expect(result.current.projects).toEqual([launch, audit]);
    });
    expect(result.current.loading).toBe(false);
  });

  it("shares one request between every component that needs the list", async () => {
    const { result } = renderHook(
      () => {
        return [useProjects(), useProjects()];
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current[1].projects).toHaveLength(2);
    });
    expect(projectsApi.list).toHaveBeenCalledOnce();
  });

  it("shows the API's message when loading fails", async () => {
    vi.mocked(projectsApi.list).mockRejectedValue(
      new ApiError(429, "RATE_LIMITED", "Too many requests."),
    );

    const { result } = renderHook(useProjects, { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe("Too many requests.");
    });
    expect(result.current.loading).toBe(false);
  });

  it("adds a created project to the cached list without fetching it again", async () => {
    const created = buildProject({ uuid: "new", name: "New" });
    vi.mocked(projectsApi.create).mockResolvedValue(created);
    const { result } = renderWithList(useCreateProject);
    await waitFor(() => {
      expect(result.current.list.loading).toBe(false);
    });

    await act(() => {
      return result.current.hook.mutateAsync({
        name: "New",
        description: "Description",
        status: "ACTIVE",
        priority: "MEDIUM",
        dueDate: null,
      });
    });

    await waitFor(() => {
      expect(result.current.list.projects).toEqual([launch, audit, created]);
    });
    expect(projectsApi.list).toHaveBeenCalledOnce();
  });

  it("replaces an updated project in the cached list", async () => {
    const renamed = { ...audit, name: "Security audit" };
    vi.mocked(projectsApi.update).mockResolvedValue(renamed);
    const { result } = renderWithList(useUpdateProject);
    await waitFor(() => {
      expect(result.current.list.loading).toBe(false);
    });

    await act(() => {
      return result.current.hook.mutateAsync({
        uuid: "audit",
        input: { name: "Security audit" },
      });
    });

    expect(projectsApi.update).toHaveBeenCalledWith("audit", {
      name: "Security audit",
    });
    await waitFor(() => {
      expect(result.current.list.projects).toEqual([launch, renamed]);
    });
  });

  it("removes a deleted project from the cached list", async () => {
    vi.mocked(projectsApi.remove).mockResolvedValue(undefined);
    const { result } = renderWithList(useDeleteProject);
    await waitFor(() => {
      expect(result.current.list.loading).toBe(false);
    });

    await act(() => {
      return result.current.hook.mutateAsync("launch");
    });

    await waitFor(() => {
      expect(result.current.list.projects).toEqual([audit]);
    });
  });

  it("fetches the list again when a write fails, in case it's out of date", async () => {
    vi.mocked(projectsApi.remove).mockRejectedValue(
      new ApiError(404, "NOT_FOUND", "Project not found"),
    );
    const { result } = renderWithList(useDeleteProject);
    await waitFor(() => {
      expect(result.current.list.loading).toBe(false);
    });
    vi.mocked(projectsApi.list).mockResolvedValue([audit]);

    await act(async () => {
      await expect(
        result.current.hook.mutateAsync("launch"),
      ).rejects.toBeInstanceOf(ApiError);
    });

    await waitFor(() => {
      expect(result.current.list.projects).toEqual([audit]);
    });
    expect(projectsApi.list).toHaveBeenCalledTimes(2);
  });

  it("keys every projects query under one prefix", () => {
    expect(projectKeys.list()).toEqual(["projects", "list"]);
  });
});
