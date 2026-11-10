import { z } from "zod";

import { calendarDateSchema } from "../calendarDate.js";
import type { Project } from "./model.js";
import { projectPriorities, projectStatuses } from "./model.js";

const projectFieldsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(projectStatuses),
  priority: z.enum(projectPriorities),
  dueDate: calendarDateSchema.nullable(),
});

export const createProjectSchema = projectFieldsSchema.extend({
  dueDate: projectFieldsSchema.shape.dueDate.default(null),
});

export const updateProjectSchema = projectFieldsSchema.partial();

export const projectFiltersSchema = z.object({
  status: z.enum(projectStatuses).optional(),
  priority: z.enum(projectPriorities).optional(),
});

export type CreateProjectRequest = z.infer<typeof createProjectSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectSchema>;
export type ProjectFilters = z.infer<typeof projectFiltersSchema>;
export type ProjectResponse = Project;
