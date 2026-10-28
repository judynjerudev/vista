import { z } from "zod";

import type { Project } from "./model.js";
import { projectPriorities, projectStatuses } from "./model.js";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(projectStatuses),
  priority: z.enum(projectPriorities),
  ownerUuid: z.string().min(1, "Owner is required"),
  dueDate: z.string().nullable().default(null),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectFiltersSchema = z.object({
  status: z.enum(projectStatuses).optional(),
  priority: z.enum(projectPriorities).optional(),
});

export type CreateProjectRequest = z.infer<typeof createProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectSchema>;
export type ProjectFilters = z.infer<typeof projectFiltersSchema>;
export type ProjectResponse = Project;
