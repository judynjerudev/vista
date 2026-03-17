import type { Project } from '../../shared/types';

import type { DueProject } from '../components/overview/DueSoonCard';
import { DueSoonCard } from '../components/overview/DueSoonCard';
import { PriorityBreakdownCard } from '../components/overview/PriorityBreakdownCard';
import { RecentlyUpdatedCard } from '../components/overview/RecentlyUpdatedCard';
import { StatisticsCard } from '../components/overview/StatisticsCard';
import { StatusDistributionCard } from '../components/overview/StatusDistributionCard';
import { ProjectForm } from '../components/project/ProjectForm';
import { ProjectsTable } from '../components/project/ProjectsTable';
import { useProjectForm } from '../hooks/useProjectForm';
import { useProjects } from '../hooks/useProjects';

type DashboardProps = {
  onNavigateToProjects?: () => void;
};

export const Dashboard = ({ onNavigateToProjects }: DashboardProps) => {
  const { projects, loading, error, createProject, updateProject } = useProjects();
  const { formOpen, editingProject, openEditForm, closeForm } = useProjectForm();

  const activeCount = projects.filter((project) => {
    return project.status === 'ACTIVE';
  }).length;

  const blockedCount = projects.filter((project) => {
    return project.status === 'BLOCKED';
  }).length;

  const completedCount = projects.filter((project) => {
    return project.status === 'COMPLETED';
  }).length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentProjects = projects.filter((project) => {
    return new Date(project.createdAt).getTime() >= thirtyDaysAgo.getTime();
  });

  const dueSoonProjects = getDueSoonProjects(projects);
  const recentlyUpdatedProjects = getRecentlyUpdatedProjects(projects);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard label="Total Projects" value={projects.length} />
        <StatisticsCard label="Active" value={activeCount} variant="active" />
        <StatisticsCard label="Blocked" value={blockedCount} variant="blocked" />
        <StatisticsCard label="Completed" value={completedCount} variant="completed" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatusDistributionCard projects={projects} />
        <PriorityBreakdownCard projects={projects} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DueSoonCard
          projects={dueSoonProjects}
          onEdit={openEditForm}
          onViewAll={onNavigateToProjects}
        />
        <RecentlyUpdatedCard
          projects={recentlyUpdatedProjects}
          onEdit={openEditForm}
          onViewAll={onNavigateToProjects}
        />
      </div>
      <div className="space-y-normal">
        <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
        {loading && <p className="text-sm text-gray-500">Loading projects...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <ProjectsTable projects={recentProjects} />
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

const millisecondsPerDay = 24 * 60 * 60 * 1000;

const getDueSoonProjects = (projects: Project[]): DueProject[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfTodayMs = today.getTime();
  const endOfDueSoonWindowMs = startOfTodayMs + 7 * millisecondsPerDay;

  return projects
    .filter((project): project is Project & { dueDate: string } => {
      return project.dueDate !== null && project.dueDate !== '';
    })
    .map((project): DueProject | null => {
      const dueTimeMs = new Date(project.dueDate).getTime();
      const isOverdue = dueTimeMs < startOfTodayMs;
      const isDueSoon = dueTimeMs >= startOfTodayMs && dueTimeMs <= endOfDueSoonWindowMs;

      if (!isOverdue && !isDueSoon) {
        return null;
      }
      return { project, isOverdue };
    })
    .filter((entry): entry is DueProject => entry !== null)
    .sort((dueProjectA, dueProjectB) => {
      return new Date(dueProjectA.project.dueDate).getTime() - new Date(dueProjectB.project.dueDate).getTime();
    })
    .slice(0, 5);
};

const getRecentlyUpdatedProjects = (projects: Project[]): Project[] => {
  return [...projects]
    .sort((projectA, projectB) => {
      return new Date(projectB.updatedAt).getTime() - new Date(projectA.updatedAt).getTime();
    })
    .slice(0, 5);
};
