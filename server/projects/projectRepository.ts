import type { Project } from "../../shared/projects/model.js";
import type { ProjectFilters } from "../../shared/projects/contracts.js";

export type NewProject = Omit<Project, "uuid">;
export type ProjectChanges = Partial<Omit<Project, "uuid" | "createdAt">>;

export type ProjectRepository = {
  findAll: (filters?: ProjectFilters) => Promise<Project[]>;
  findByUuid: (uuid: string) => Promise<Project | undefined>;
  insert: (data: NewProject) => Promise<Project>;
  update: (
    uuid: string,
    changes: ProjectChanges,
  ) => Promise<Project | undefined>;
  remove: (uuid: string) => Promise<boolean>;
};
