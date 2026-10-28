import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "../../shared/projects/model.js";
import type { CreateProjectRequest } from "../../shared/projects/contracts.js";
import { ApiError } from "../http/errors.js";
import type { ProjectRepository } from "./projectRepository.js";
import { createProjectService } from "./projectService.js";

const createInMemoryProjectRepository = (
  seed: Project[] = [],
): ProjectRepository & { projects: Project[] } => {
  const projects = [...seed];
  let nextId = 1;

  return {
    projects,

    findAll: async (filters) => {
      return projects.filter((project) => {
        return (
          (!filters?.status || project.status === filters.status) &&
          (!filters?.priority || project.priority === filters.priority)
        );
      });
    },

    findByUuid: async (uuid) => {
      return projects.find((project) => {
        return project.uuid === uuid;
      });
    },

    insert: async (data) => {
      const project = { uuid: `project-${nextId++}`, ...data };
      projects.push(project);
      return project;
    },

    update: async (uuid, changes) => {
      const index = projects.findIndex((project) => {
        return project.uuid === uuid;
      });
      if (index === -1) {
        return undefined;
      }
      projects[index] = { ...projects[index], ...changes };
      return projects[index];
    },

    remove: async (uuid) => {
      const index = projects.findIndex((project) => {
        return project.uuid === uuid;
      });
      if (index === -1) {
        return false;
      }
      projects.splice(index, 1);
      return true;
    },
  };
};

const createdAt = "2026-01-01T00:00:00.000Z";
const now = "2026-03-15T12:00:00.000Z";

const existingProject: Project = {
  uuid: "existing",
  name: "Existing",
  description: "Already stored",
  status: "ACTIVE",
  priority: "HIGH",
  ownerUuid: "owner-1",
  dueDate: null,
  createdAt,
  updatedAt: createdAt,
};

const createRequest: CreateProjectRequest = {
  name: "New project",
  description: "Fresh",
  status: "BACKLOG",
  priority: "LOW",
  ownerUuid: "owner-2",
  dueDate: null,
};

const expectNotFound = async (promise: Promise<unknown>) => {
  await expect(promise).rejects.toBeInstanceOf(ApiError);
  await expect(promise).rejects.toMatchObject({ statusCode: 404 });
};

describe("projectService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists projects matching the filters", async () => {
    const backlogProject = {
      ...existingProject,
      uuid: "backlog",
      status: "BACKLOG" as const,
    };
    const service = createProjectService(
      createInMemoryProjectRepository([existingProject, backlogProject]),
    );

    expect(await service.list({ status: "BACKLOG" })).toEqual([backlogProject]);
  });

  it("sets both timestamps when creating a project", async () => {
    const repository = createInMemoryProjectRepository();
    const service = createProjectService(repository);

    const project = await service.create(createRequest);

    expect(project).toEqual({
      uuid: "project-1",
      ...createRequest,
      createdAt: now,
      updatedAt: now,
    });
    expect(repository.projects).toHaveLength(1);
  });

  it("returns an existing project", async () => {
    const service = createProjectService(
      createInMemoryProjectRepository([existingProject]),
    );

    expect(await service.get("existing")).toEqual(existingProject);
  });

  it("throws not found when getting a missing project", async () => {
    const service = createProjectService(createInMemoryProjectRepository());

    await expectNotFound(service.get("missing"));
  });

  it("bumps `updatedAt` and keeps `createdAt` when updating", async () => {
    const service = createProjectService(
      createInMemoryProjectRepository([existingProject]),
    );

    const project = await service.update("existing", { name: "Renamed" });

    expect(project).toEqual({
      ...existingProject,
      name: "Renamed",
      updatedAt: now,
    });
  });

  it("throws not found when updating a missing project", async () => {
    const service = createProjectService(createInMemoryProjectRepository());

    await expectNotFound(service.update("missing", { name: "Renamed" }));
  });

  it("removes an existing project", async () => {
    const repository = createInMemoryProjectRepository([existingProject]);
    const service = createProjectService(repository);

    await service.remove("existing");

    expect(repository.projects).toEqual([]);
  });

  it("throws not found when removing a missing project", async () => {
    const service = createProjectService(createInMemoryProjectRepository());

    await expectNotFound(service.remove("missing"));
  });
});
