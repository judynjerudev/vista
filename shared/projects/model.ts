import type { CalendarDate } from "../calendarDate.js";

export const projectStatuses = [
  "BACKLOG",
  "ACTIVE",
  "BLOCKED",
  "COMPLETED",
] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const projectPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type ProjectPriority = (typeof projectPriorities)[number];

export interface Project {
  uuid: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  ownerUuid: string;
  dueDate: CalendarDate | null;
  createdAt: string;
  updatedAt: string;
}
