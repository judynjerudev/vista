import type { Project } from "@shared/projects/model";

import { Edit as EditIcon, TrashCan as TrashIcon } from "@carbon/icons-react";

import { Badge } from "./Badge";
import { statusBadgeVariant } from "./statusBadgeVariant";
import { Button } from "@/components/ui/Button";
import { formatDate } from "../../utils/relativeTime";

type ProjectsTableProps = {
  projects: Project[];
  onAdd?: () => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
};

const priorityDot: Record<string, string> = {
  LOW: "bg-emerald-400",
  MEDIUM: "bg-amber-400",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-rose-600",
};

export const ProjectsTable = ({
  projects,
  onAdd,
  onEdit,
  onDelete,
}: ProjectsTableProps) => {
  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ddd8cf] p-12 text-center">
        <p className="text-sm text-gray-400">No projects yet.</p>
        {onAdd && (
          <div className="mt-normal">
            <Button variant="primary" text="Add Project" onClick={onAdd} />
          </div>
        )}
      </div>
    );
  }

  const showActions = onEdit !== undefined || onDelete !== undefined;

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#eae5dc] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
      <table className="min-w-full divide-y divide-[#f0ece4]">
        <thead>
          <tr className="bg-[#faf7f2]">
            <th className="px-relaxed py-normal text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-400 whitespace-nowrap">
              Name
            </th>
            <th className="px-relaxed py-normal text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
              Description
            </th>
            <th className="px-relaxed py-normal text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
              Status
            </th>
            <th className="px-relaxed py-normal text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
              Priority
            </th>
            <th className="px-relaxed py-normal text-left text-xs font-bold uppercase tracking-[0.14em] text-gray-400 whitespace-nowrap">
              Due Date
            </th>
            {showActions && (
              <th className="px-normal py-normal text-right text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0ece4]">
          {projects.map((project) => (
            <tr
              key={project.uuid}
              className="group/row transition-all duration-150 hover:bg-[#faf7f2] hover:shadow-[inset_3px_0_0_rgba(91,78,255,0.35)]"
            >
              <td className="px-relaxed py-normal whitespace-nowrap">
                <span className="text-sm font-semibold text-gray-900 transition-colors duration-150 group-hover/row:text-[#5b4eff]">
                  {project.name}
                </span>
              </td>

              <td className="px-relaxed py-normal text-sm text-gray-400">
                <div className="max-w-[200px] truncate">
                  {project.description}
                </div>
              </td>

              <td className="px-relaxed py-normal">
                <Badge
                  label={project.status}
                  variant={statusBadgeVariant[project.status]}
                />
              </td>
              <td className="px-relaxed py-normal">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${priorityDot[project.priority] ?? "bg-gray-300"}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-gray-600">
                    {project.priority.charAt(0).toUpperCase() +
                      project.priority.slice(1).toLowerCase()}
                  </span>
                </div>
              </td>
              <td className="px-relaxed py-normal text-sm text-gray-500 whitespace-nowrap">
                {project.dueDate ? formatDate(project.dueDate) : "—"}
              </td>
              {showActions && (
                <td className="px-relaxed py-normal text-right">
                  <div className="flex justify-end gap-1">
                    {onEdit && (
                      <Button
                        variant="tertiary"
                        icon={<EditIcon size={16} />}
                        format="icon"
                        className="text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                        onClick={() => onEdit(project)}
                      />
                    )}
                    {onDelete && (
                      <Button
                        variant="tertiary"
                        icon={<TrashIcon size={16} />}
                        format="icon"
                        className="text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => onDelete(project)}
                      />
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-[#f0ece4] bg-[#faf7f2] px-relaxed py-normal">
        <p className="text-xs-sm font-bold uppercase tracking-[0.12em] text-gray-400">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </p>
      </div>
    </div>
  );
};
