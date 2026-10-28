import {
  countProjectsByStatus,
  DueSoonCard,
  getDueSoonProjects,
  getRecentlyCreatedProjects,
  getRecentlyUpdatedProjects,
  PriorityBreakdownCard,
  ProjectForm,
  ProjectsTable,
  RecentlyUpdatedCard,
  StatisticsCard,
  StatusDistributionCard,
  useProjectForm,
  useProjects,
} from "@/features/projects";

type DashboardProps = {
  onNavigateToProjects?: () => void;
};

export const Dashboard = ({ onNavigateToProjects }: DashboardProps) => {
  const { projects, loading, error, createProject, updateProject } =
    useProjects();
  const { formOpen, editingProject, closeForm } = useProjectForm();

  const activeCount = countProjectsByStatus(projects, "ACTIVE");
  const blockedCount = countProjectsByStatus(projects, "BLOCKED");
  const completedCount = countProjectsByStatus(projects, "COMPLETED");
  const recentProjects = getRecentlyCreatedProjects(projects, 30);

  const dueSoonProjects = getDueSoonProjects(projects);
  const recentlyUpdatedProjects = getRecentlyUpdatedProjects(projects);

  return (
    <div className="space-y-10">
      <div className="stats-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard label="Total Projects" value={projects.length} />
        <StatisticsCard label="Active" value={activeCount} variant="active" />
        <StatisticsCard
          label="Blocked"
          value={blockedCount}
          variant="blocked"
        />
        <StatisticsCard
          label="Completed"
          value={completedCount}
          variant="completed"
        />
      </div>
      <div className="overview-grid grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <StatusDistributionCard projects={projects} />
        </div>
        <div className="lg:col-span-2">
          <PriorityBreakdownCard projects={projects} />
        </div>
      </div>
      <div className="overview-grid grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <DueSoonCard
            projects={dueSoonProjects}
            onViewAll={onNavigateToProjects}
          />
        </div>
        <div className="lg:col-span-3">
          <RecentlyUpdatedCard
            projects={recentlyUpdatedProjects}
            onViewAll={onNavigateToProjects}
          />
        </div>
      </div>
      <div className="space-y-normal">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Projects
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">
            <span
              className="h-1.5 w-1.5 rounded-full bg-indigo-400"
              aria-hidden="true"
            />
            Last 30 days
          </span>
        </div>
        {loading && (
          <p className="text-sm text-gray-500">Loading projects...</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!loading && !error && recentProjects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-black/[0.1] px-8 py-14 text-center">
            <p className="text-sm font-semibold text-gray-500">
              No new projects this month
            </p>
            <p className="mt-1 text-sm text-gray-400">
              There are currently no new projects. Please check back later.
            </p>
          </div>
        )}
        {!loading && !error && recentProjects.length > 0 && (
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
