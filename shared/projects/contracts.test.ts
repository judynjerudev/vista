import { describe, expect, it } from "vitest";

import { createProjectSchema, updateProjectSchema } from "./contracts.js";

const validRequest = {
  name: "Project",
  description: "Description",
  status: "ACTIVE",
  priority: "MEDIUM",
};

describe("project contracts", () => {
  it("accepts a calendar due date", () => {
    const result = createProjectSchema.safeParse({
      ...validRequest,
      dueDate: "2026-03-18",
    });

    expect(result.success && result.data.dueDate).toBe("2026-03-18");
  });

  it("defaults a missing due date to null", () => {
    const result = createProjectSchema.safeParse(validRequest);

    expect(result.success && result.data.dueDate).toBeNull();
  });

  it("rejects a timestamp due date", () => {
    const result = createProjectSchema.safeParse({
      ...validRequest,
      dueDate: "2026-03-18T00:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });

  it("drops a client-supplied owner", () => {
    const result = createProjectSchema.safeParse({
      ...validRequest,
      ownerUuid: "someone-else",
    });

    expect(result.success && result.data).not.toHaveProperty("ownerUuid");
  });

  it("allows clearing the due date on update", () => {
    const result = updateProjectSchema.safeParse({ dueDate: null });

    expect(result.success && result.data.dueDate).toBeNull();
  });

  it("leaves out a due date the update doesn't mention", () => {
    const result = updateProjectSchema.safeParse({ name: "Renamed" });

    expect(result.success && result.data).toEqual({ name: "Renamed" });
  });
});
