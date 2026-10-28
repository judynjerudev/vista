export type {
  Project,
  ProjectPriority,
  ProjectStatus,
} from "@shared/projects/model";
export type {
  CreateProjectRequest,
  UpdateProjectRequest,
} from "@shared/projects/contracts";

export { projectsApi } from "./api";
export { useProjectForm, useProjects } from "./hooks";
