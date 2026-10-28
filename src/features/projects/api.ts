import type {
  CreateProjectRequest,
  ProjectResponse,
  UpdateProjectRequest,
} from "@shared/projects/contracts";

import { http } from "@/lib/http";

const projectsPath = "/api/projects";

export const projectsApi = {
  list: (): Promise<ProjectResponse[]> => {
    return http<ProjectResponse[]>(projectsPath);
  },

  create: (body: CreateProjectRequest): Promise<ProjectResponse> => {
    return http<ProjectResponse>(projectsPath, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  update: (
    uuid: string,
    body: UpdateProjectRequest,
  ): Promise<ProjectResponse> => {
    return http<ProjectResponse>(`${projectsPath}/${uuid}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  remove: (uuid: string): Promise<void> => {
    return http<void>(`${projectsPath}/${uuid}`, { method: "DELETE" });
  },
};
