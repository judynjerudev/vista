import { useState } from 'react';

import type { Project } from '../../shared/types';

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
