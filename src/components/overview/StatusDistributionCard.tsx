import type { Project, ProjectStatus } from '../../../shared/types';
import { OverviewCard } from './OverviewCard';

const statusOrder: ProjectStatus[] = ['BACKLOG', 'ACTIVE', 'BLOCKED', 'COMPLETED'];

const statusConfig: Record<
  ProjectStatus,
  { label: string; color: string; conicColor: string }
> = {
  BACKLOG: { label: 'Backlog', color: 'bg-gray-500', conicColor: '#6b7280' },
  ACTIVE: { label: 'Active', color: 'bg-blue-500', conicColor: '#3b82f6' },
  BLOCKED: { label: 'Blocked', color: 'bg-red-500', conicColor: '#ef4444' },
  COMPLETED: { label: 'Completed', color: 'bg-green-500', conicColor: '#22c55e' },
};

type StatusDistributionCardProps = {
  projects: Project[];
};

export const StatusDistributionCard = ({ projects }: StatusDistributionCardProps) => {
  const total = projects.length;
  const counts = statusOrder.reduce(
    (acc, status) => {
      acc[status] = projects.filter((project) => {
        return project.status === status;
      }).length;
      return acc;
    },
    {} as Record<ProjectStatus, number>
  );

  const conicGradientStops =
    total === 0
      ? 'transparent'
      : statusOrder
          .map((status, statusIndex) => {
            const count = counts[status];
            if (count === 0) {
              return null;
            }
            const percentage = (count / total) * 100;
            const previousPercentage = statusOrder
              .slice(0, statusIndex)
              .reduce((sum, precedingStatus) => {
                return sum + (counts[precedingStatus] / total) * 100;
              }, 0);
            return `${statusConfig[status].conicColor} ${previousPercentage}% ${previousPercentage + percentage}%`;
          })
          .filter(Boolean)
          .join(', ');

  return (
    <OverviewCard title="Status distribution">
      <div className="flex flex-col items-center gap-normal sm:flex-row sm:items-start">
        <div
          className="relative h-32 w-32 shrink-0 rounded-full"
          style={{
            background:
              total === 0
                ? 'conic-gradient(#e5e7eb 0% 100%)'
                : `conic-gradient(${conicGradientStops})`,
          }}
        >
          <div className="absolute inset-[20%] rounded-full bg-white" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-semibold text-gray-700">{total}</span>
          </div>
        </div>
        <ul className="flex flex-1 flex-wrap gap-x-normal gap-y-xsmall">
          {statusOrder.map((status) => (
            <li key={status} className="flex items-center gap-small text-sm">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusConfig[status].color}`}
                aria-hidden
              />
              <span className="text-gray-600">{statusConfig[status].label}</span>
              <span className="font-medium text-gray-900">{counts[status]}</span>
            </li>
          ))}
        </ul>
      </div>
    </OverviewCard>
  );
};
