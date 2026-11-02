import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient, UseMutationResult } from "@tanstack/react-query";

import type { Project } from "@shared/projects/model";
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
} from "@shared/projects/contracts";

import { getErrorMessage } from "@/lib/http";
import { projectsApi } from "./api";

// Every projects query key starts with "projects", so one call can refresh
// or remove all of them.
export const projectKeys = {
  all: ["projects"] as const,
  list: () => {
    return [...projectKeys.all, "list"] as const;
  },
};

// The same empty list every time, so components don't re-render for a new
// `[]` while the first load is in progress.
const noProjects: Project[] = [];

type UseProjects = {
  projects: Project[];
  loading: boolean;
  error: string | null;
};

// Every component that calls this shares one cached list and one request.
export const useProjects = (): UseProjects => {
  const { data, isPending, error } = useQuery({
    queryKey: projectKeys.list(),
    queryFn: projectsApi.list,
  });

  return {
    projects: data ?? noProjects,
    // Only the first load: a background refresh keeps showing the cache.
    loading: isPending,
    error: error ? getErrorMessage(error, "Failed to load projects") : null,
  };
};

// The API answers a write with the saved project, so the cached list is
// updated from that response instead of being fetched again.
const updateCachedList = (
  queryClient: QueryClient,
  update: (projects: Project[]) => Project[],
): void => {
  queryClient.setQueryData<Project[]>(projectKeys.list(), (projects) => {
    return projects && update(projects);
  });
};

// A failed write may mean the cached list is out of date, for example a
// project deleted in another tab, so it's fetched again.
const refreshList = (queryClient: QueryClient): Promise<void> => {
  return queryClient.invalidateQueries({ queryKey: projectKeys.all });
};

export const useCreateProject = (): UseMutationResult<
  Project,
  Error,
  CreateProjectRequest
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (created) => {
      updateCachedList(queryClient, (projects) => {
        return [...projects, created];
      });
    },
    onError: () => {
      return refreshList(queryClient);
    },
  });
};

type UpdateProjectVariables = {
  uuid: string;
  input: UpdateProjectRequest;
};

export const useUpdateProject = (): UseMutationResult<
  Project,
  Error,
  UpdateProjectVariables
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uuid, input }: UpdateProjectVariables) => {
      return projectsApi.update(uuid, input);
    },
    onSuccess: (updated) => {
      updateCachedList(queryClient, (projects) => {
        return projects.map((project) => {
          return project.uuid === updated.uuid ? updated : project;
        });
      });
    },
    onError: () => {
      return refreshList(queryClient);
    },
  });
};

export const useDeleteProject = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectsApi.remove,
    onSuccess: (_, uuid) => {
      updateCachedList(queryClient, (projects) => {
        return projects.filter((project) => {
          return project.uuid !== uuid;
        });
      });
    },
    onError: () => {
      return refreshList(queryClient);
    },
  });
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
