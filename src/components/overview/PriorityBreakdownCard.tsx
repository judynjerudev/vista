import type { Project, ProjectPriority } from '../../../shared/types';
import { OverviewCard } from './OverviewCard';

const priorityOrder: ProjectPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const priorityBarColors: Record<ProjectPriority, string> = {
  LOW: 'bg-green-400',
  MEDIUM: 'bg-blue-400',
  HIGH: 'bg-amber-400',
  CRITICAL: 'bg-red-500',
};

type PriorityBreakdownCardProps = {
  projects: Project[];
};

export const PriorityBreakdownCard = ({ projects }: PriorityBreakdownCardProps) => {
  const total = projects.length;
  const counts = priorityOrder.reduce(
    (acc, priority) => {
      acc[priority] = projects.filter((project) => {
        return project.priority === priority;
      }).length;
      return acc;
    },
    {} as Record<ProjectPriority, number>
  );

  return (
    <OverviewCard title="Priority breakdown">
      <ul className="space-y-normal">
        {priorityOrder.map((priority) => {
          const count = counts[priority];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          return (
            <li key={priority}>
              <div className="mb-xsmall flex justify-between text-sm">
                <span className="font-medium text-gray-700 capitalize">
                  {priority.toLowerCase()}
                </span>
                <span className="text-gray-500">{count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full transition-[width] ${priorityBarColors[priority]}`}
                  style={{ width: `${percentage}%` }}
                  role="presentation"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </OverviewCard>
  );
};
