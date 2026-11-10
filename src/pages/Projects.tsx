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
  const { data: projects, isPending, error } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { formOpen, editingProject, openCreateForm, openEditForm, closeForm } =
    useProjectForm();
  const saveProject = editingProject ? updateProject : createProject;

  const closeProjectForm = (): void => {
    createProject.reset();
    updateProject.reset();
    closeForm();
  };

  const handleDelete = (project: Project): void => {
    if (!confirm(`Delete "${project.name}"?`)) {
      return;
    }
    deleteProject.mutate(project.uuid);
  };

  return (
    <div className="space-y-normal">
      <div className="flex justify-between">
        <h2 className="text-lg font-semibold text-gray-900">All Projects</h2>
        <Button variant="primary" text="Add Project" onClick={openCreateForm} />
      </div>
      {isPending && (
        <p className="text-sm text-gray-500">Loading projects...</p>
      )}
      {error && (
        <p className="text-sm text-red-600">
          {getErrorMessage(error, "Failed to load projects")}
        </p>
      )}
      {deleteProject.error && (
        <p role="alert" className="text-sm text-red-600">
          {getErrorMessage(
            deleteProject.error,
            "Couldn't delete the project. Try again.",
          )}
        </p>
      )}
      {projects && (
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
          onSubmit={(formData) => {
            if (editingProject) {
              updateProject.mutate(
                { uuid: editingProject.uuid, input: formData },
                { onSuccess: closeProjectForm },
              );
            } else {
              createProject.mutate(formData, { onSuccess: closeProjectForm });
            }
          }}
          onCancel={closeProjectForm}
          submitting={saveProject.isPending}
          error={
            saveProject.error &&
            getErrorMessage(
              saveProject.error,
              "Couldn't save the project. Try again.",
            )
          }
        />
      )}
    </div>
  );
};
