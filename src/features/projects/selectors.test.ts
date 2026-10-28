import { describe, expect, it } from "vitest";

import type { Project } from "@shared/projects/model";

import {
  countProjectsByStatus,
  getDueSoonProjects,
  getRecentlyCreatedProjects,
  getRecentlyUpdatedProjects,
} from "./selectors";

const now = new Date("2026-03-15T12:00:00");

const buildProject = (overrides: Partial<Project>): Project => {
  return {
    uuid: "project",
    name: "Project",
    description: "Description",
    status: "ACTIVE",
    priority: "MEDIUM",
    ownerUuid: "owner",
    dueDate: null,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
    ...overrides,
  };
};

describe("countProjectsByStatus", () => {
  it("counts only projects with the given status", () => {
    const projects = [
      buildProject({ uuid: "a", status: "ACTIVE" }),
      buildProject({ uuid: "b", status: "BLOCKED" }),
      buildProject({ uuid: "c", status: "ACTIVE" }),
    ];

    expect(countProjectsByStatus(projects, "ACTIVE")).toBe(2);
    expect(countProjectsByStatus(projects, "COMPLETED")).toBe(0);
  });
});

describe("getRecentlyCreatedProjects", () => {
  it("keeps projects created within the window", () => {
    const recent = buildProject({ uuid: "recent", createdAt: "2026-03-01" });
    const old = buildProject({ uuid: "old", createdAt: "2026-01-01" });

    expect(getRecentlyCreatedProjects([recent, old], 30, now)).toEqual([
      recent,
    ]);
  });
});

describe("getDueSoonProjects", () => {
  it("returns overdue and due-within-7-days projects, soonest first", () => {
    const overdue = buildProject({ uuid: "overdue", dueDate: "2026-03-10" });
    const dueSoon = buildProject({ uuid: "soon", dueDate: "2026-03-18" });
    const later = buildProject({ uuid: "later", dueDate: "2026-04-30" });
    const noDueDate = buildProject({ uuid: "none", dueDate: null });

    expect(
      getDueSoonProjects([later, dueSoon, noDueDate, overdue], now),
    ).toEqual([
      { project: overdue, isOverdue: true },
      { project: dueSoon, isOverdue: false },
    ]);
  });

  it("returns at most five projects", () => {
    const projects = Array.from({ length: 7 }, (_, index) => {
      return buildProject({ uuid: `p${index}`, dueDate: "2026-03-16" });
    });

    expect(getDueSoonProjects(projects, now)).toHaveLength(5);
  });
});

describe("getRecentlyUpdatedProjects", () => {
  it("returns the five most recently updated projects", () => {
    const projects = Array.from({ length: 6 }, (_, index) => {
      return buildProject({
        uuid: `p${index}`,
        updatedAt: `2026-03-0${index + 1}T00:00:00.000Z`,
      });
    });

    expect(
      getRecentlyUpdatedProjects(projects).map((project) => {
        return project.uuid;
      }),
    ).toEqual(["p5", "p4", "p3", "p2", "p1"]);
  });
});
