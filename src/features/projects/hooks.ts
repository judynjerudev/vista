import { useState } from "react";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  QueryClient,
  UseMutationResult,
  UseQueryResult,
} from "@tanstack/react-query";

import type { Project } from "@shared/projects/model";
import type {
  CreateProjectRequest,
  UpdateProjectRequest,
} from "@shared/projects/contracts";

import { projectsApi } from "./api";

export const projectQueries = {
  all: (): readonly ["projects"] => {
    return ["projects"] as const;
  },
  list: () => {
    return queryOptions({
      queryKey: [...projectQueries.all(), "list"] as const,
      queryFn: ({ signal }) => {
        return projectsApi.list(signal);
      },
    });
  },
};

export const useProjects = (): UseQueryResult<Project[]> => {
  return useQuery(projectQueries.list());
};

const invalidateProjects = (queryClient: QueryClient): Promise<void> => {
  return queryClient.invalidateQueries({ queryKey: projectQueries.all() });
};

export const useCreateProject = (): UseMutationResult<
  Project,
  Error,
  CreateProjectRequest
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectRequest) => {
      return projectsApi.create(input);
    },
    onSettled: () => {
      return invalidateProjects(queryClient);
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
    onSettled: () => {
      return invalidateProjects(queryClient);
    },
  });
};

export const useDeleteProject = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => {
      return projectsApi.remove(uuid);
    },
    onSettled: () => {
      return invalidateProjects(queryClient);
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
