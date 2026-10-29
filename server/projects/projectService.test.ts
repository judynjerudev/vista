import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Project } from "../../shared/projects/model.js";
import type { CreateProjectRequest } from "../../shared/projects/contracts.js";
import type { AuthUser } from "../auth/authenticate.js";
import { AppError } from "../errors.js";
import type { ProjectRepository } from "./projectRepository.js";
import { createProjectService } from "./projectService.js";

const createInMemoryProjectRepository = (
  seed: Project[] = [],
): ProjectRepository & { projects: Project[] } => {
  const projects = [...seed];
  let nextId = 1;

  const findOwnedIndex = (uuid: string, ownerUuid: string): number => {
    return projects.findIndex((project) => {
      return project.uuid === uuid && project.ownerUuid === ownerUuid;
    });
  };

  return {
    projects,

    findAll: async (ownerUuid, filters) => {
      return projects.filter((project) => {
        return (
          project.ownerUuid === ownerUuid &&
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

    update: async (uuid, ownerUuid, changes) => {
      const index = findOwnedIndex(uuid, ownerUuid);
      if (index === -1) {
        return undefined;
      }
      projects[index] = { ...projects[index], ...changes };
      return projects[index];
    },

    remove: async (uuid, ownerUuid) => {
      const index = findOwnedIndex(uuid, ownerUuid);
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

const owner: AuthUser = { uid: "owner-1", email: "owner@example.com" };
const stranger: AuthUser = { uid: "owner-2", email: "stranger@example.com" };

const existingProject: Project = {
  uuid: "existing",
  name: "Existing",
  description: "Already stored",
  status: "ACTIVE",
  priority: "HIGH",
  ownerUuid: owner.uid,
  dueDate: null,
  createdAt,
  updatedAt: createdAt,
};

const createRequest: CreateProjectRequest = {
  name: "New project",
  description: "Fresh",
  status: "BACKLOG",
  priority: "LOW",
  dueDate: null,
};

const expectNotFound = async (promise: Promise<unknown>) => {
  await expect(promise).rejects.toBeInstanceOf(AppError);
  await expect(promise).rejects.toMatchObject({ code: "NOT_FOUND" });
};

describe("projectService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists the user's projects matching the filters", async () => {
    const backlogProject = {
      ...existingProject,
      uuid: "backlog",
      status: "BACKLOG" as const,
    };
    const service = createProjectService(
      createInMemoryProjectRepository([existingProject, backlogProject]),
    );

    expect(await service.list(owner, { status: "BACKLOG" })).toEqual([
      backlogProject,
    ]);
  });

  it("lists only the user's own projects", async () => {
    const strangersProject = {
      ...existingProject,
      uuid: "strangers",
      ownerUuid: stranger.uid,
    };
    const service = createProjectService(
      createInMemoryProjectRepository([existingProject, strangersProject]),
    );

    expect(await service.list(owner)).toEqual([existingProject]);
    expect(await service.list(stranger)).toEqual([strangersProject]);
  });

  it("sets the owner and both timestamps when creating a project", async () => {
    const repository = createInMemoryProjectRepository();
    const service = createProjectService(repository);

    const project = await service.create(owner, createRequest);

    expect(project).toEqual({
      uuid: "project-1",
      ...createRequest,
      ownerUuid: owner.uid,
      createdAt: now,
      updatedAt: now,
    });
    expect(repository.projects).toHaveLength(1);
  });

  it("returns the user's own project", async () => {
    const service = createProjectService(
      createInMemoryProjectRepository([existingProject]),
    );

    expect(await service.get(owner, "existing")).toEqual(existingProject);
  });

  it("throws not found when getting a missing project", async () => {
    const service = createProjectService(createInMemoryProjectRepository());

    await expectNotFound(service.get(owner, "missing"));
  });

  it("bumps `updatedAt` and keeps `createdAt` when updating", async () => {
    const service = createProjectService(
      createInMemoryProjectRepository([existingProject]),
    );

    const project = await service.update(owner, "existing", {
      name: "Renamed",
    });

    expect(project).toEqual({
      ...existingProject,
      name: "Renamed",
      updatedAt: now,
    });
  });

  it("throws not found when updating a missing project", async () => {
    const service = createProjectService(createInMemoryProjectRepository());

    await expectNotFound(service.update(owner, "missing", { name: "Renamed" }));
  });

  it("removes the user's own project", async () => {
    const repository = createInMemoryProjectRepository([existingProject]);
    const service = createProjectService(repository);

    await service.remove(owner, "existing");

    expect(repository.projects).toEqual([]);
  });

  it("throws not found when removing a missing project", async () => {
    const service = createProjectService(createInMemoryProjectRepository());

    await expectNotFound(service.remove(owner, "missing"));
  });

  describe("another user's project", () => {
    it("can't be read", async () => {
      const service = createProjectService(
        createInMemoryProjectRepository([existingProject]),
      );

      await expectNotFound(service.get(stranger, "existing"));
    });

    it("can't be updated", async () => {
      const repository = createInMemoryProjectRepository([existingProject]);
      const service = createProjectService(repository);

      await expectNotFound(
        service.update(stranger, "existing", { name: "Taken over" }),
      );
      expect(repository.projects).toEqual([existingProject]);
    });

    it("can't be removed", async () => {
      const repository = createInMemoryProjectRepository([existingProject]);
      const service = createProjectService(repository);

      await expectNotFound(service.remove(stranger, "existing"));
      expect(repository.projects).toEqual([existingProject]);
    });
  });
});
