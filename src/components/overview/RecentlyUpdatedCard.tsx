import type { Project } from '../../../shared/types';
import { Edit as EditIcon } from '@carbon/icons-react';
import { Button } from '../layout/Button';
import { OverviewCard } from './OverviewCard';
import { formatRelativeTime } from '../../utils/relativeTime';

type RecentlyUpdatedCardProps = {
  projects: Project[];
  onEdit: (project: Project) => void;
  onViewAll?: () => void;
};

export const RecentlyUpdatedCard = ({ projects, onEdit, onViewAll }: RecentlyUpdatedCardProps) => {
  const recentProjects = [...projects]
    .sort((projectA, projectB) => {
      return new Date(projectB.updatedAt).getTime() - new Date(projectA.updatedAt).getTime();
    })
    .slice(0, 5);

  if (recentProjects.length === 0) {
    return (
      <OverviewCard title="Recently updated">
        <p className="text-sm text-gray-500">No projects yet.</p>
      </OverviewCard>
    );
  }

  return (
    <OverviewCard title="Recently updated" onViewAll={onViewAll}>
      <ul className="space-y-normal">
        {recentProjects.map((project) => (
          <li
            key={project.uuid}
            className="flex items-center justify-between gap-normal rounded-md py-xsmall"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{project.name}</p>
              <p className="text-xs text-gray-500">{formatRelativeTime(project.updatedAt)}</p>
            </div>
            <Button
              variant="tertiary"
              format="icon"
              icon={<EditIcon size={16} />}
              className="shrink-0 hover:text-indigo-600 hover:bg-indigo-50"
              onClick={() => onEdit(project)}
              aria-label={`Edit ${project.name}`}
            />
          </li>
        ))}
      </ul>
    </OverviewCard>
  );
};
