import { describe, expect, it } from "vitest";
import type { DocumentSnapshot } from "firebase-admin/firestore";

import { toProject } from "./firestoreProjectRepository.js";

const storedProject = {
  name: "Project",
  description: "Description",
  status: "ACTIVE",
  priority: "MEDIUM",
  ownerUuid: "owner",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
};

const snapshotOf = (data: Record<string, unknown>): DocumentSnapshot => {
  return {
    id: "project-1",
    data: () => {
      return data;
    },
  } as unknown as DocumentSnapshot;
};

describe("toProject", () => {
  it("keeps a stored calendar due date", () => {
    const project = toProject(
      snapshotOf({ ...storedProject, dueDate: "2026-03-18" }),
    );

    expect(project).toEqual({
      uuid: "project-1",
      ...storedProject,
      dueDate: "2026-03-18",
    });
  });

  it("normalizes a stored timestamp due date to a calendar date", () => {
    const project = toProject(
      snapshotOf({ ...storedProject, dueDate: "2026-03-18T00:00:00.000Z" }),
    );

    expect(project.dueDate).toBe("2026-03-18");
  });

  it.each([null, undefined, "", "not a date"])(
    "maps a stored due date of %j to null",
    (dueDate) => {
      expect(toProject(snapshotOf({ ...storedProject, dueDate })).dueDate).toBe(
        null,
      );
    },
  );
});
