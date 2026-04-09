import type { Project, ProjectPriority } from "../../../shared/types";
import { OverviewCard } from "./OverviewCard";

const priorityOrder: ProjectPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const priorityConfig: Record<
  ProjectPriority,
  { bar: string; track: string; dot: string; height: string }
> = {
  LOW: {
    bar: "bg-gradient-to-r from-teal-300 to-emerald-400",
    track: "bg-teal-50",
    dot: "bg-emerald-400",
    height: "h-1.5",
  },
  MEDIUM: {
    bar: "bg-gradient-to-r from-amber-300 to-yellow-400",
    track: "bg-amber-50",
    dot: "bg-amber-400",
    height: "h-2",
  },
  HIGH: {
    bar: "bg-gradient-to-r from-orange-400 to-red-400",
    track: "bg-orange-50",
    dot: "bg-orange-500",
    height: "h-2.5",
  },
  CRITICAL: {
    bar: "bg-gradient-to-r from-rose-500 to-red-600",
    track: "bg-rose-50",
    dot: "bg-rose-600",
    height: "h-3",
  },
};

type PriorityBreakdownCardProps = {
  projects: Project[];
};

export const PriorityBreakdownCard = ({
  projects,
}: PriorityBreakdownCardProps) => {
  const total = projects.length;
  const counts = priorityOrder.reduce(
    (acc, priority) => {
      acc[priority] = projects.filter(
        (project) => project.priority === priority,
      ).length;
      return acc;
    },
    {} as Record<ProjectPriority, number>,
  );

  return (
    <OverviewCard title="Priority breakdown">
      <ul className="space-y-[18px]">
        {priorityOrder.map((priority) => {
          const count = counts[priority];
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const config = priorityConfig[priority];
          return (
            <li key={priority}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${config.dot}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold capitalize text-gray-700">
                    {priority.toLowerCase()}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[1.05rem] font-black leading-none text-gray-900">
                    {count}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {total > 0 ? `${Math.round(percentage)}%` : "—"}
                  </span>
                </div>
              </div>
              <div
                className={`w-full overflow-hidden rounded-full ${config.track} ${config.height}`}
              >
                <div
                  className={`${config.height} rounded-full transition-[width] duration-700 ${config.bar}`}
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
