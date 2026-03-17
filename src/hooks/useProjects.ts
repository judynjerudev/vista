import { useState, useEffect } from 'react';
import type { Project } from '../../shared/types';
import { api, ApiError } from '../api/client';
import type { CreateProjectInput, UpdateProjectInput } from '../../api/lib/schemas';

type UseProjects = {
  projects: Project[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createProject: (input: CreateProjectInput) => Promise<void>;
  updateProject: (uuid: string, input: UpdateProjectInput) => Promise<void>;
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
      const data = await api<Project[]>('/api/projects');
      setProjects(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load projects';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (input: CreateProjectInput) => {
    const newProject = await api<Project>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setProjects((prev) => [...prev, newProject]);
  };

  const updateProject = async (uuid: string, input: UpdateProjectInput) => {
    const editedProject = await api<Project>(`/api/projects/${uuid}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    setProjects((prev) =>
      prev.map((project) => (project.uuid === uuid ? editedProject : project))
    );
  };

  const deleteProject = async (uuid: string) => {
    await api<void>(`/api/projects/${uuid}`, { method: 'DELETE' });
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
