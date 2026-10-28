import type { Project } from "@shared/projects/model";

import { Badge } from "../project/Badge";
import { OverviewCard } from "./OverviewCard";
import { statusBadgeVariant } from "../project/statusBadgeVariant";
import { formatDate } from "../../utils/relativeTime";

export type DueProject = {
  project: Project & { dueDate: string };
  isOverdue: boolean;
};

type DueSoonCardProps = {
  projects: DueProject[];
  onViewAll?: () => void;
};

export const DueSoonCard = ({ projects, onViewAll }: DueSoonCardProps) => {
  if (projects.length === 0) {
    return (
      <OverviewCard title="Due soon / Overdue">
        <p className="text-sm text-gray-400">
          No projects due in the next 7 days or overdue.
        </p>
      </OverviewCard>
    );
  }

  return (
    <OverviewCard title="Due soon / Overdue" onViewAll={onViewAll}>
      <ul className="relative space-y-0">
        <div
          className="pointer-events-none absolute left-[6px] top-3 bottom-3 w-px bg-gradient-to-b from-gray-200 via-gray-200 to-transparent"
          aria-hidden="true"
        />

        {projects.map(({ project, isOverdue }) => (
          <li
            key={project.uuid}
            className="relative flex items-start gap-4 pb-4 last:pb-0"
          >
            <div
              className={[
                "relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2",
                isOverdue
                  ? "overdue-pulse border-rose-500 bg-rose-500"
                  : "border-amber-400 bg-white",
              ].join(" ")}
              aria-hidden="true"
            />
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {project.name}
                </p>
                <p
                  className={`text-xs ${isOverdue ? "font-semibold text-rose-500" : "text-gray-400"}`}
                >
                  {formatDate(project.dueDate)}
                </p>
              </div>
              <Badge
                label={isOverdue ? "OVERDUE" : project.status}
                variant={
                  isOverdue ? "danger" : statusBadgeVariant[project.status]
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </OverviewCard>
  );
};
