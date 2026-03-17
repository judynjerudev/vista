import { useState } from 'react';

import type { Project } from '../../shared/types';

import { useProjects } from '../hooks/useProjects';
import { ProjectsTable } from '../components/project/ProjectsTable';
import { ProjectForm } from '../components/project/ProjectForm';
import { Button } from '../components/layout/Button';

export const Projects = () => {
  const { projects, loading, error, createProject, updateProject, deleteProject } = useProjects();
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

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"?`)) {
      return;
    }
    await deleteProject(project.uuid);
  };

  return (
    <div className="space-y-normal">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Projects</h2>
        <Button variant="primary" text="Add Project" onClick={openCreateForm} />
      </div>
      {loading && <p className="text-sm text-gray-500">Loading projects...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && (
        <ProjectsTable
          projects={projects}
          onAdd={openCreateForm}
          onEdit={openEditForm}
          onDelete={handleDelete}
        />
      )}

      {formOpen && (
        <ProjectForm
          project={editingProject}
          onSubmit={async (formData) => {
            if (editingProject) {
              await updateProject(editingProject.uuid, formData);
            } else {
              await createProject(formData);
            }
            closeForm();
          }}
          onCancel={closeForm}
        />
      )}
    </div>
  );
};
