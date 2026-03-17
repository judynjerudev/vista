import type { Project } from '../../../shared/types';

import { Edit as EditIcon, TrashCan as TrashIcon } from '@carbon/icons-react';

import { Badge } from './Badge';
import { statusBadgeVariant } from './statusBadgeVariant';
import { Button } from '../layout/Button';

type ProjectsTableProps = {
  projects: Project[];
  onAdd?: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
};

export const ProjectsTable = ({ projects, onAdd, onEdit, onDelete }: ProjectsTableProps) => {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <p className="text-sm text-gray-500">No projects yet.</p>
        {onAdd && <Button variant="primary" text="Add Project" onClick={onAdd} />}
      </div>
    );
  }

  const showActions = onEdit !== undefined || onDelete !== undefined;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Priority
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Due Date
            </th>
            {showActions && (
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {projects.map((project) => {
            return (
              <tr key={project.uuid} className="hover:bg-gray-50 transition-colors">
                <td className="px-relaxed py-normal text-sm text-gray-500">{project.name}</td>
                <td className="px-relaxed py-normal text-sm text-gray-500">
                  {project.description}
                </td>
                <td className="px-relaxed py-normal">
                  <Badge label={project.status} variant={statusBadgeVariant[project.status]} />
                </td>
                <td className="px-relaxed py-normal">
                  <span className="text-sm text-gray-600 capitalize">
                    {project.priority.toLowerCase()}
                  </span>
                </td>
                <td className="px-relaxed py-normal text-sm text-gray-500">
                  {project.dueDate ?? '—'}
                </td>
                {showActions && (
                  <td className="px-relaxed py-normal text-right">
                    <div className="flex justify-end">
                      {onEdit && (
                        <Button
                          variant="tertiary"
                          icon={<EditIcon size={20} />}
                          format="icon"
                          className="hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => onEdit(project)}
                        />
                      )}
                      {onDelete && (
                        <Button
                          variant="tertiary"
                          icon={<TrashIcon size={20} />}
                          format="icon"
                          className="hover:text-red-600 hover:bg-red-50"
                          onClick={() => onDelete(project)}
                        />
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
