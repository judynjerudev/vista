import type { Project } from "../../shared/projects/model.js";
import type { ProjectFilters } from "../../shared/projects/contracts.js";

export type NewProject = Omit<Project, "uuid">;
export type ProjectChanges = Partial<Omit<Project, "uuid" | "createdAt">>;

// `update` and `remove` check ownership in the same transaction as the write,
// and treat a project owned by someone else as missing.
export type ProjectRepository = {
  findAll: (ownerUuid: string, filters?: ProjectFilters) => Promise<Project[]>;
  findByUuid: (uuid: string) => Promise<Project | undefined>;
  insert: (data: NewProject) => Promise<Project>;
  update: (
    uuid: string,
    ownerUuid: string,
    changes: ProjectChanges,
  ) => Promise<Project | undefined>;
  remove: (uuid: string, ownerUuid: string) => Promise<boolean>;
};
