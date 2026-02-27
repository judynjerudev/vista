import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['BACKLOG', 'ACTIVE', 'BLOCKED', 'COMPLETED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  ownerUuid: z.string().min(1, 'Owner is required'),
  dueDate: z.string().nullable().default(null),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectFiltersSchema = z.object({
  status: z.enum(['BACKLOG', 'ACTIVE', 'BLOCKED', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectFilters = z.infer<typeof projectFiltersSchema>;
