import type { Project } from '../../shared/types';

import { Button } from '../components/layout/Button';
import { ProjectForm } from '../components/project/ProjectForm';
import { ProjectsTable } from '../components/project/ProjectsTable';
import { useProjectForm } from '../hooks/useProjectForm';
import { useProjects } from '../hooks/useProjects';

export const Projects = () => {
  const { projects, loading, error, createProject, updateProject, deleteProject } = useProjects();
  const { formOpen, editingProject, openCreateForm, openEditForm, closeForm } = useProjectForm();

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
