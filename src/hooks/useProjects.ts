import { useState, useEffect } from "react";
import type { Project } from "@shared/projects/model";
import { ApiError, http } from "@/lib/http";
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
} from "@shared/projects/contracts";

type UseProjects = {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createProject: (input: CreateProjectRequest) => Promise<void>;
  updateProject: (uuid: string, input: UpdateProjectRequest) => Promise<void>;
  deleteProject: (uuid: string) => Promise<void>;
};

export const useProjects = (): UseProjects => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await http<Project[]>("/api/projects");
      setProjects(data);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to load projects";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (input: CreateProjectRequest) => {
    const newProject = await http<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setProjects((prev) => [...prev, newProject]);
  };

  const updateProject = async (uuid: string, input: UpdateProjectRequest) => {
    const editedProject = await http<Project>(`/api/projects/${uuid}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    setProjects((prev) =>
      prev.map((project) => (project.uuid === uuid ? editedProject : project)),
    );
  };

  const deleteProject = async (uuid: string) => {
    await http<void>(`/api/projects/${uuid}`, { method: "DELETE" });
    setProjects((prev) => prev.filter((project) => project.uuid !== uuid));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};
