import type { Project, ProjectStatus } from "@shared/projects/model";
import { OverviewCard } from "./OverviewCard";

const statusOrder: ProjectStatus[] = [
  "BACKLOG",
  "ACTIVE",
  "BLOCKED",
  "COMPLETED",
];

const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    color: string;
    conicColor: string;
    pillBg: string;
    pillText: string;
  }
> = {
  BACKLOG: {
    label: "Backlog",
    color: "bg-slate-400",
    conicColor: "#94a3b8",
    pillBg: "bg-slate-100",
    pillText: "text-slate-600",
  },
  ACTIVE: {
    label: "Active",
    color: "bg-sky-400",
    conicColor: "#38bdf8",
    pillBg: "bg-sky-50",
    pillText: "text-sky-700",
  },
  BLOCKED: {
    label: "Blocked",
    color: "bg-rose-400",
    conicColor: "#fb7185",
    pillBg: "bg-rose-50",
    pillText: "text-rose-700",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-emerald-400",
    conicColor: "#34d399",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
  },
};

type StatusDistributionCardProps = {
  projects: Project[];
};

export const StatusDistributionCard = ({
  projects,
}: StatusDistributionCardProps) => {
  const total = projects.length;
  const counts = statusOrder.reduce(
    (acc, status) => {
      acc[status] = projects.filter(
        (project) => project.status === status,
      ).length;
      return acc;
    },
    {} as Record<ProjectStatus, number>,
  );

  const conicGradientStops =
    total === 0
      ? "transparent"
      : statusOrder
          .map((status, statusIndex) => {
            const count = counts[status];
            if (count === 0) return null;
            const percentage = (count / total) * 100;
            const previousPercentage = statusOrder
              .slice(0, statusIndex)
              .reduce(
                (sum, precedingStatus) =>
                  sum + (counts[precedingStatus] / total) * 100,
                0,
              );
            return `${statusConfig[status].conicColor} ${previousPercentage}% ${previousPercentage + percentage}%`;
          })
          .filter(Boolean)
          .join(", ");

  return (
    <OverviewCard title="Status distribution">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div
          className="relative h-36 w-36 shrink-0 rounded-full"
          style={{
            background:
              total === 0
                ? "conic-gradient(#e5e7eb 0% 100%)"
                : `conic-gradient(${conicGradientStops})`,
          }}
        >
          <div className="absolute inset-[17%] rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),inset_0_2px_8px_rgba(0,0,0,0.06)]" />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[1.6rem] font-black leading-none tracking-tight text-gray-800">
              {total}
            </span>
            <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-gray-400">
              total
            </span>
          </div>
        </div>
        <ul className="flex flex-1 flex-col gap-2">
          {statusOrder.map((status) => {
            const count = counts[status];
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            const config = statusConfig[status];
            return (
              <li
                key={status}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${config.pillBg}`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${config.color}`}
                  aria-hidden="true"
                />
                <span
                  className={`flex-1 text-sm font-semibold ${config.pillText}`}
                >
                  {config.label}
                </span>
                <span className="text-[11px] font-medium text-gray-400">
                  {percent}%
                </span>
                <span className={`text-sm font-black ${config.pillText}`}>
                  {count}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </OverviewCard>
  );
};
