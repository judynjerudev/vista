import type { ProjectStatus } from "@shared/projects/model";
import type { BadgeVariant } from "./Badge";

export const statusBadgeVariant: Record<ProjectStatus, BadgeVariant> = {
  BACKLOG: "neutral",
  ACTIVE: "success",
  BLOCKED: "warning",
  COMPLETED: "info",
};
