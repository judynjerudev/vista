import type { Project, ProjectStatus } from "@shared/projects/model";

export type DueProject = {
  project: Project & { dueDate: string };
  isOverdue: boolean;
};

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export const countProjectsByStatus = (
  projects: Project[],
  status: ProjectStatus,
): number => {
  return projects.filter((project) => {
    return project.status === status;
  }).length;
};

export const getRecentlyCreatedProjects = (
  projects: Project[],
  days: number,
  now: Date = new Date(),
): Project[] => {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - days);

  return projects.filter((project) => {
    return new Date(project.createdAt).getTime() >= windowStart.getTime();
  });
};

export const getDueSoonProjects = (
  projects: Project[],
  now: Date = new Date(),
): DueProject[] => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const startOfTodayMs = today.getTime();
  const endOfDueSoonWindowMs = startOfTodayMs + 7 * millisecondsPerDay;

  return projects
    .filter((project): project is Project & { dueDate: string } => {
      return project.dueDate !== null && project.dueDate !== "";
    })
    .map((project): DueProject | null => {
      const dueTimeMs = new Date(project.dueDate).getTime();
      const isOverdue = dueTimeMs < startOfTodayMs;
      const isDueSoon =
        dueTimeMs >= startOfTodayMs && dueTimeMs <= endOfDueSoonWindowMs;

      if (!isOverdue && !isDueSoon) {
        return null;
      }
      return { project, isOverdue };
    })
    .filter((entry): entry is DueProject => entry !== null)
    .sort((dueProjectA, dueProjectB) => {
      return (
        new Date(dueProjectA.project.dueDate).getTime() -
        new Date(dueProjectB.project.dueDate).getTime()
      );
    })
    .slice(0, 5);
};

export const getRecentlyUpdatedProjects = (projects: Project[]): Project[] => {
  return [...projects]
    .sort((projectA, projectB) => {
      return (
        new Date(projectB.updatedAt).getTime() -
        new Date(projectA.updatedAt).getTime()
      );
    })
    .slice(0, 5);
};
