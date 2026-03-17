import type { Project } from '../../../shared/types';

import { Edit as EditIcon } from '@carbon/icons-react';

import { Badge } from '../project/Badge';
import { statusBadgeVariant } from '../project/statusBadgeVariant';
import { Button } from '../layout/Button';
import { OverviewCard } from './OverviewCard';

const formatDueDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

type DueSoonCardProps = {
  projects: Project[];
  onEdit: (project: Project) => void;
  onViewAll?: () => void;
};

type DueProject = {
  project: Project & { dueDate: string };
  isOverdue: boolean;
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export const DueSoonCard = ({ projects, onEdit, onViewAll }: DueSoonCardProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfTodayMs = today.getTime();
  const endOfDueSoonWindowMs = startOfTodayMs + 7 * millisecondsPerDay;

  const urgentProjects = projects
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

  if (urgentProjects.length === 0) {
    return (
      <OverviewCard title="Due soon / Overdue">
        <p className="text-sm text-gray-500">No projects due in the next 7 days or overdue.</p>
      </OverviewCard>
    );
  }

  return (
    <OverviewCard title="Due soon / Overdue" onViewAll={onViewAll}>
      <ul className="space-y-normal">
        {urgentProjects.map(({ project, isOverdue }) => (
          <li
            key={project.uuid}
            className={[
              'flex items-center justify-between gap-normal rounded-md border-l-4 py-xsmall pr-small',
              isOverdue ? 'border-l-red-500 bg-red-50/50' : 'border-l-amber-400 bg-amber-50/30',
            ].join(' ')}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{project.name}</p>
              <p className="text-xs text-gray-500">{formatDueDate(project.dueDate)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-small">
              <Badge label={project.status} variant={statusBadgeVariant[project.status]} />
              <Button
                variant="tertiary"
                format="icon"
                icon={<EditIcon size={16} />}
                className="hover:text-indigo-600 hover:bg-indigo-50"
                onClick={() => onEdit(project)}
                aria-label={`Edit ${project.name}`}
              />
            </div>
          </li>
        ))}
      </ul>
    </OverviewCard>
  );
};
