export type ProjectStatus = 'BACKLOG' | 'ACTIVE' | 'BLOCKED' | 'COMPLETED';

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  uuid: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  ownerUuid: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}
