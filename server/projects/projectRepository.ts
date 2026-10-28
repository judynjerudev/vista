import type { Project } from "../../shared/projects/model.js";
import type {
  CreateProjectRequest,
  ProjectFilters,
  UpdateProjectRequest,
} from "../../shared/projects/contracts.js";

export type ProjectRepository = {
  findAll: (filters?: ProjectFilters) => Promise<Project[]>;
  findByUuid: (uuid: string) => Promise<Project | undefined>;
  create: (input: CreateProjectRequest) => Promise<Project>;
  update: (
    uuid: string,
    input: UpdateProjectRequest,
  ) => Promise<Project | undefined>;
  remove: (uuid: string) => Promise<boolean>;
};
