import type { Project } from "../../shared/projects/model.js";
import type {
  CreateProjectRequest,
  ProjectFilters,
  UpdateProjectRequest,
} from "../../shared/projects/contracts.js";
import type { AuthUser } from "../auth/authenticate.js";
import { notFound } from "../errors.js";
import type { ProjectRepository } from "./projectRepository.js";

export type ProjectService = {
  list: (actor: AuthUser, filters?: ProjectFilters) => Promise<Project[]>;
  get: (actor: AuthUser, uuid: string) => Promise<Project>;
  create: (actor: AuthUser, input: CreateProjectRequest) => Promise<Project>;
  update: (
    actor: AuthUser,
    uuid: string,
    input: UpdateProjectRequest,
  ) => Promise<Project>;
  remove: (actor: AuthUser, uuid: string) => Promise<void>;
};

export const createProjectService = (
  repository: ProjectRepository,
): ProjectService => {
  return {
    list: (actor, filters) => {
      return repository.findAll(actor.uid, filters);
    },

    get: async (actor, uuid) => {
      const project = await repository.findByUuid(uuid);
      if (!project || project.ownerUuid !== actor.uid) {
        throw notFound("Project");
      }
      return project;
    },

    create: (actor, input) => {
      const now = new Date().toISOString();
      return repository.insert({
        ...input,
        ownerUuid: actor.uid,
        createdAt: now,
        updatedAt: now,
      });
    },

    update: async (actor, uuid, input) => {
      const project = await repository.update(uuid, actor.uid, {
        ...input,
        updatedAt: new Date().toISOString(),
      });
      if (!project) {
        throw notFound("Project");
      }
      return project;
    },

    remove: async (actor, uuid) => {
      const deleted = await repository.remove(uuid, actor.uid);
      if (!deleted) {
        throw notFound("Project");
      }
    },
  };
};
