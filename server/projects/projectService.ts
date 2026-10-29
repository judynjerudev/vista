import type { Project } from "../../shared/projects/model.js";
import type {
  CreateProjectRequest,
  ProjectFilters,
  UpdateProjectRequest,
} from "../../shared/projects/contracts.js";
import { notFound } from "../errors.js";
import type { ProjectRepository } from "./projectRepository.js";

export type ProjectService = {
  list: (filters?: ProjectFilters) => Promise<Project[]>;
  get: (uuid: string) => Promise<Project>;
  create: (input: CreateProjectRequest) => Promise<Project>;
  update: (uuid: string, input: UpdateProjectRequest) => Promise<Project>;
  remove: (uuid: string) => Promise<void>;
};

export const createProjectService = (
  repository: ProjectRepository,
): ProjectService => {
  return {
    list: (filters) => {
      return repository.findAll(filters);
    },

    get: async (uuid) => {
      const project = await repository.findByUuid(uuid);
      if (!project) {
        throw notFound("Project");
      }
      return project;
    },

    create: (input) => {
      const now = new Date().toISOString();
      return repository.insert({ ...input, createdAt: now, updatedAt: now });
    },

    update: async (uuid, input) => {
      const project = await repository.update(uuid, {
        ...input,
        updatedAt: new Date().toISOString(),
      });
      if (!project) {
        throw notFound("Project");
      }
      return project;
    },

    remove: async (uuid) => {
      const deleted = await repository.remove(uuid);
      if (!deleted) {
        throw notFound("Project");
      }
    },
  };
};
