import { useEffect, useState } from "react";

import type { Project } from "@shared/projects/model";
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
} from "@shared/projects/contracts";

import { ApiError } from "@/lib/http";
import { projectsApi } from "./api";

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
      const data = await projectsApi.list();
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
    const newProject = await projectsApi.create(input);
    setProjects((prev) => [...prev, newProject]);
  };

  const updateProject = async (uuid: string, input: UpdateProjectRequest) => {
    const editedProject = await projectsApi.update(uuid, input);
    setProjects((prev) =>
      prev.map((project) => (project.uuid === uuid ? editedProject : project)),
    );
  };

  const deleteProject = async (uuid: string) => {
    await projectsApi.remove(uuid);
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

type UseProjectForm = {
  formOpen: boolean;
  editingProject: Project | undefined;
  openCreateForm: () => void;
  openEditForm: (project: Project) => void;
  closeForm: () => void;
};

export const useProjectForm = (): UseProjectForm => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  const openCreateForm = () => {
    setEditingProject(undefined);
    setFormOpen(true);
  };

  const openEditForm = (project: Project) => {
    setEditingProject(project);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingProject(undefined);
  };

  return { formOpen, editingProject, openCreateForm, openEditForm, closeForm };
};
