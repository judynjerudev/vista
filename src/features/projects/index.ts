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

export { ProjectForm } from "./components/ProjectForm";
export { ProjectsTable } from "./components/ProjectsTable";
export type { DueProject } from "./overview/DueSoonCard";
export { DueSoonCard } from "./overview/DueSoonCard";
export { PriorityBreakdownCard } from "./overview/PriorityBreakdownCard";
export { RecentlyUpdatedCard } from "./overview/RecentlyUpdatedCard";
export { StatisticsCard } from "./overview/StatisticsCard";
export { StatusDistributionCard } from "./overview/StatusDistributionCard";
