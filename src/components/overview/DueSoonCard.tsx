import type { Project } from '../../../shared/types';

import { Edit as EditIcon } from '@carbon/icons-react';

import { Badge } from '../project/Badge';
import { Button } from '../layout/Button';
import { OverviewCard } from './OverviewCard';
import { statusBadgeVariant } from '../project/statusBadgeVariant';

export type DueProject = {
  project: Project & { dueDate: string };
  isOverdue: boolean;
};

const formatDueDate = (iso: string): string => {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

type DueSoonCardProps = {
  projects: DueProject[];
  onEdit: (project: Project) => void;
  onViewAll?: () => void;
};

export const DueSoonCard = ({ projects, onEdit, onViewAll }: DueSoonCardProps) => {
  if (projects.length === 0) {
    return (
      <OverviewCard title="Due soon / Overdue">
        <p className="text-sm text-gray-500">No projects due in the next 7 days or overdue.</p>
      </OverviewCard>
    );
  }

  return (
    <OverviewCard title="Due soon / Overdue" onViewAll={onViewAll}>
      <ul className="space-y-normal">
        {projects.map(({ project, isOverdue }) => {
          return (
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
                  onClick={() => {
                    return onEdit(project);
                  }}
                  aria-label={`Edit ${project.name}`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </OverviewCard>
  );
};
