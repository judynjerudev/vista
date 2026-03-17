import { useState } from 'react';

import type { Project } from '../../shared/types';
import { useProjects } from '../hooks/useProjects';
import { DueSoonCard } from '../components/overview/DueSoonCard';
import { PriorityBreakdownCard } from '../components/overview/PriorityBreakdownCard';
import { ProjectsTable } from '../components/project/ProjectsTable';
import { ProjectForm } from '../components/project/ProjectForm';
import { RecentlyUpdatedCard } from '../components/overview/RecentlyUpdatedCard';
import { StatusDistributionCard } from '../components/overview/StatusDistributionCard';
import { Button } from '../components/layout/Button';

type StatVariant = 'default' | 'active' | 'blocked' | 'completed';

const variantStyles: Record<StatVariant, string> = {
  default: 'border-gray-200',
  active: 'border-l-4 border-l-blue-500 border-gray-200',
  blocked: 'border-l-4 border-l-red-500 border-gray-200',
  completed: 'border-l-4 border-l-green-500 border-gray-200',
};

const StatisticsCard = ({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: number;
  variant?: StatVariant;
}) => {
  return (
    <div className={`rounded-lg border bg-white p-relaxed ${variantStyles[variant]}`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-xsmall text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
};

type DashboardProps = {
  onNavigateToProjects?: () => void;
};

export const Dashboard = ({ onNavigateToProjects }: DashboardProps) => {
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
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard label="Total Projects" value={projects.length} />
        <StatisticsCard
          label="Active"
          value={projects.filter((project) => project.status === 'ACTIVE').length}
          variant="active"
        />
        <StatisticsCard
          label="Blocked"
          value={projects.filter((project) => project.status === 'BLOCKED').length}
          variant="blocked"
        />
        <StatisticsCard
          label="Completed"
          value={projects.filter((project) => project.status === 'COMPLETED').length}
          variant="completed"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatusDistributionCard projects={projects} />
        <PriorityBreakdownCard projects={projects} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DueSoonCard
          projects={projects}
          onEdit={openEditForm}
          onViewAll={onNavigateToProjects}
        />
        <RecentlyUpdatedCard
          projects={projects}
          onEdit={openEditForm}
          onViewAll={onNavigateToProjects}
        />
      </div>
      <div className="space-y-normal">
        <div className="flex justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
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
      </div>

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
