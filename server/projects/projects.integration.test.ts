import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import projectHandler from "../../api/projects/[uuid].js";
import projectsHandler from "../../api/projects.js";
import type { CreateProjectRequest } from "../../shared/projects/contracts.js";
import type { Project } from "../../shared/projects/model.js";
import { db } from "../firebase.js";
import { callHandler } from "../http/testing.js";

const emulatorUrl = `http://${process.env.FIRESTORE_EMULATOR_HOST}`;
const documentsPath = `projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const clearDatabase = async (): Promise<void> => {
  const response = await fetch(`${emulatorUrl}/emulator/v1/${documentsPath}`, {
    method: "DELETE",
  });
  expect(response.ok).toBe(true);
};

const newProject: CreateProjectRequest = {
  name: "Launch",
  description: "Ship the first version",
  status: "ACTIVE",
  priority: "HIGH",
  ownerUuid: "owner-1",
  dueDate: "2026-11-20",
};

const createProject = async (
  overrides: Partial<CreateProjectRequest> = {},
): Promise<Project> => {
  const response = await callHandler(projectsHandler, {
    method: "POST",
    body: { ...newProject, ...overrides },
  });
  expect(response.statusCode).toBe(201);
  return response.body as Project;
};

const callProject = (
  uuid: string,
  method: string,
  body?: unknown,
): ReturnType<typeof callHandler> => {
  return callHandler(projectHandler, { method, query: { uuid }, body });
};

describe("projects API against the Firestore emulator", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates, reads, updates and deletes a project", async () => {
    const created = await createProject();
    expect(created).toMatchObject({ ...newProject, uuid: expect.any(String) });

    const fetched = await callProject(created.uuid, "GET");
    expect(fetched.statusCode).toBe(200);
    expect(fetched.body).toEqual(created);

    const updated = await callProject(created.uuid, "PUT", {
      name: "Relaunch",
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.body).toMatchObject({
      name: "Relaunch",
      dueDate: "2026-11-20",
    });

    const stored = await callProject(created.uuid, "GET");
    expect(stored.body).toEqual(updated.body);

    const deleted = await callProject(created.uuid, "DELETE");
    expect(deleted.statusCode).toBe(204);

    const missing = await callProject(created.uuid, "GET");
    expect(missing.statusCode).toBe(404);
  });

  it("lists projects matching the filters", async () => {
    const active = await createProject();
    await createProject({ name: "Later", status: "BACKLOG" });

    const response = await callHandler(projectsHandler, {
      method: "GET",
      query: { status: "ACTIVE" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([active]);
  });

  it("returns 404 when updating or deleting a missing project", async () => {
    const update = await callProject("missing", "PUT", { name: "Renamed" });
    const remove = await callProject("missing", "DELETE");

    expect(update.statusCode).toBe(404);
    expect(remove.statusCode).toBe(404);

    const stored = await db.collection("projects").doc("missing").get();
    expect(stored.exists).toBe(false);
  });

  it("deletes a project exactly once under concurrent requests", async () => {
    const { uuid } = await createProject();

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => {
        return callProject(uuid, "DELETE");
      }),
    );
    const statusCodes = responses.map((response) => {
      return response.statusCode;
    });

    expect(statusCodes.filter((code) => code === 204)).toHaveLength(1);
    expect(statusCodes.filter((code) => code === 404)).toHaveLength(4);
  });

  it("skips a corrupt document in the list and fails reading it alone", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const valid = await createProject();
    await db
      .collection("projects")
      .doc("corrupt")
      .set({ ...newProject, status: "ARCHIVED" });

    const list = await callHandler(projectsHandler, { method: "GET" });
    expect(list.body).toEqual([valid]);

    const single = await callProject("corrupt", "GET");
    expect(single.statusCode).toBe(500);
    expect(single.body).toEqual({
      error: { code: "INTERNAL", message: "Stored project is invalid" },
    });
  });
});

describe("Firestore security rules", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  // Requests without the emulator's admin token are evaluated against
  // `firestore.rules`, as browser requests would be in production.
  it("deny reading projects directly", async () => {
    const { uuid } = await createProject();

    const response = await fetch(
      `${emulatorUrl}/v1/${documentsPath}/projects/${uuid}`,
    );

    expect(response.status).toBe(403);
  });

  it("deny writing projects directly", async () => {
    const response = await fetch(
      `${emulatorUrl}/v1/${documentsPath}/projects`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { name: { stringValue: "Injected" } } }),
      },
    );

    expect(response.status).toBe(403);
  });
});
