// @vitest-environment jsdom
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "@shared/projects/model";

import { ApiError } from "@/lib/http";
import { projectsApi } from "./api";
import {
  projectQueries,
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

const renderWithLoadedList = async <T,>(useHook: () => T) => {
  const rendered = renderHook(
    () => {
      return { list: useProjects(), hook: useHook() };
    },
    { wrapper },
  );
  await waitFor(() => {
    expect(rendered.result.current.list.isSuccess).toBe(true);
  });
  return rendered;
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

    expect(result.current.isPending).toBe(true);
    await waitFor(() => {
      expect(result.current.data).toEqual([launch, audit]);
    });
    expect(projectsApi.list).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("shares one request between every component that needs the list", async () => {
    const { result } = renderHook(
      () => {
        return [useProjects(), useProjects()];
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current[1].data).toHaveLength(2);
    });
    expect(projectsApi.list).toHaveBeenCalledOnce();
  });

  it("returns the API's error when loading fails", async () => {
    const rateLimited = new ApiError(429, "RATE_LIMITED", "Too many requests.");
    vi.mocked(projectsApi.list).mockRejectedValue(rateLimited);

    const { result } = renderHook(useProjects, { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(rateLimited);
    });
  });

  it("fetches the list again after creating a project", async () => {
    const created = buildProject({ uuid: "new", name: "New" });
    vi.mocked(projectsApi.create).mockResolvedValue(created);
    const { result } = await renderWithLoadedList(useCreateProject);
    vi.mocked(projectsApi.list).mockResolvedValue([launch, audit, created]);

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
      expect(result.current.list.data).toEqual([launch, audit, created]);
    });
    expect(projectsApi.list).toHaveBeenCalledTimes(2);
  });

  it("fetches the list again after updating a project", async () => {
    const renamed = { ...audit, name: "Security audit" };
    vi.mocked(projectsApi.update).mockResolvedValue(renamed);
    const { result } = await renderWithLoadedList(useUpdateProject);
    vi.mocked(projectsApi.list).mockResolvedValue([launch, renamed]);

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
      expect(result.current.list.data).toEqual([launch, renamed]);
    });
  });

  it("fetches the list again after deleting a project", async () => {
    vi.mocked(projectsApi.remove).mockResolvedValue(undefined);
    const { result } = await renderWithLoadedList(useDeleteProject);
    vi.mocked(projectsApi.list).mockResolvedValue([audit]);

    await act(() => {
      return result.current.hook.mutateAsync("launch");
    });

    expect(projectsApi.remove).toHaveBeenCalledWith("launch");
    await waitFor(() => {
      expect(result.current.list.data).toEqual([audit]);
    });
  });

  it("fetches the list again when a write fails", async () => {
    vi.mocked(projectsApi.remove).mockRejectedValue(
      new ApiError(404, "NOT_FOUND", "Project not found"),
    );
    const { result } = await renderWithLoadedList(useDeleteProject);
    vi.mocked(projectsApi.list).mockResolvedValue([audit]);

    await act(async () => {
      await expect(
        result.current.hook.mutateAsync("launch"),
      ).rejects.toBeInstanceOf(ApiError);
    });

    await waitFor(() => {
      expect(result.current.list.data).toEqual([audit]);
    });
    expect(projectsApi.list).toHaveBeenCalledTimes(2);
  });

  it("stays pending until the list has been fetched again", async () => {
    vi.mocked(projectsApi.remove).mockResolvedValue(undefined);
    const { result } = await renderWithLoadedList(useDeleteProject);
    let finishRefetch: (projects: Project[]) => void = () => {};
    vi.mocked(projectsApi.list).mockReturnValue(
      new Promise((resolve) => {
        finishRefetch = resolve;
      }),
    );

    act(() => {
      result.current.hook.mutate("launch");
    });

    await waitFor(() => {
      expect(projectsApi.list).toHaveBeenCalledTimes(2);
    });
    expect(result.current.hook.isPending).toBe(true);

    act(() => {
      finishRefetch([audit]);
    });

    await waitFor(() => {
      expect(result.current.hook.isSuccess).toBe(true);
    });
    expect(result.current.list.data).toEqual([audit]);
  });

  it("keys every projects query under one prefix", () => {
    expect(projectQueries.list().queryKey).toEqual(["projects", "list"]);
  });
});
