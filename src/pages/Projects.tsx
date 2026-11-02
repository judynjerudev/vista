import { useState } from "react";

import { Button } from "@/components/ui/Button";
import type { Project } from "@/features/projects";
import {
  ProjectForm,
  ProjectsTable,
  useCreateProject,
  useDeleteProject,
  useProjectForm,
  useProjects,
  useUpdateProject,
} from "@/features/projects";
import { getErrorMessage } from "@/lib/http";

export const Projects = () => {
  const { projects, loading, error } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { formOpen, editingProject, openCreateForm, openEditForm, closeForm } =
    useProjectForm();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async (project: Project) => {
    if (!confirm(`Delete "${project.name}"?`)) {
      return;
    }
    setDeleteError(null);
    try {
      await deleteProject.mutateAsync(project.uuid);
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
              await updateProject.mutateAsync({
                uuid: editingProject.uuid,
                input: formData,
              });
            } else {
              await createProject.mutateAsync(formData);
            }
            closeForm();
          }}
          onCancel={closeForm}
        />
      )}
    </div>
  );
};
