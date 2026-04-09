import type { Project, ProjectStatus } from "../../../shared/types";

import { OverviewCard } from "./OverviewCard";
import { formatDate } from "../../utils/relativeTime";

type RecentlyUpdatedCardProps = {
  projects: Project[];
  onViewAll?: () => void;
};

const avatarPalette = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-600",
];

const statusDot: Record<ProjectStatus, string> = {
  BACKLOG: "bg-slate-300",
  ACTIVE: "bg-sky-400",
  BLOCKED: "bg-rose-400",
  COMPLETED: "bg-emerald-400",
};

const getAvatarColor = (name: string): string => {
  const idx =
    name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0) %
    avatarPalette.length;
  return avatarPalette[idx];
};

const getInitials = (name: string): string =>
  name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const RecentlyUpdatedCard = ({
  projects,
  onViewAll,
}: RecentlyUpdatedCardProps) => {
  if (projects.length === 0) {
    return (
      <OverviewCard title="Recently updated">
        <p className="text-sm text-gray-400">No projects yet.</p>
      </OverviewCard>
    );
  }

  return (
    <OverviewCard title="Recently updated" onViewAll={onViewAll}>
      <ul className="space-y-0.5">
        {projects.map((project) => (
          <li
            key={project.uuid}
            className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-gray-50"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${getAvatarColor(project.name)}`}
            >
              {getInitials(project.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">
                {project.name}
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(project.updatedAt)}
              </p>
            </div>
            <div
              className={`h-2 w-2 shrink-0 rounded-full ${statusDot[project.status]}`}
              aria-label={project.status}
            />
          </li>
        ))}
      </ul>
    </OverviewCard>
  );
};
