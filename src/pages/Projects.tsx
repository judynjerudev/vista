import { useState } from "react";

import { Button } from "@/components/ui/Button";
import type { Project } from "@/features/projects";
import {
  ProjectForm,
  ProjectsTable,
  useProjectForm,
  useProjects,
} from "@/features/projects";
import { getErrorMessage } from "@/lib/http";

export const Projects = () => {
  const {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
  } = useProjects();
  const { formOpen, editingProject, openCreateForm, openEditForm, closeForm } =
    useProjectForm();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"?`)) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteProject(project.uuid);
    } catch (err) {
      setDeleteError(
        getErrorMessage(err, `Couldn't delete "${project.name}". Try again.`),
      );
    }
  };

  return (
    <div className="space-y-normal">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Projects</h2>
        <Button variant="primary" text="Add Project" onClick={openCreateForm} />
      </div>
      {loading && <p className="text-sm text-gray-500">Loading projects...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {deleteError && (
        <p role="alert" className="text-sm text-red-600">
          {deleteError}
        </p>
      )}
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
