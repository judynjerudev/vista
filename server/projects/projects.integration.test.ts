import { getAuth } from "firebase-admin/auth";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import projectHandler from "../../api/projects/[uuid].js";
import projectsHandler from "../../api/projects.js";
import type { CreateProjectRequest } from "../../shared/projects/contracts.js";
import type { Project } from "../../shared/projects/model.js";
import { app, db } from "../firebase.js";
import { callHandler } from "../http/testing.js";

const projectId = process.env.FIREBASE_PROJECT_ID;
const emulatorUrl = `http://${process.env.FIRESTORE_EMULATOR_HOST}`;
const authEmulatorUrl = `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`;
const documentsPath = `projects/${projectId}/databases/(default)/documents`;

const clearDatabase = async (): Promise<void> => {
  const response = await fetch(`${emulatorUrl}/emulator/v1/${documentsPath}`, {
    method: "DELETE",
  });
  expect(response.ok).toBe(true);
};

const clearUsers = async (): Promise<void> => {
  const response = await fetch(
    `${authEmulatorUrl}/emulator/v1/projects/${projectId}/accounts`,
    { method: "DELETE" },
  );
  expect(response.ok).toBe(true);
};

// Creates a user in the Auth emulator and returns a real ID token for it.
// The emulator accepts any API key.
const signIn = async (
  email: string,
  { emailVerified = true } = {},
): Promise<string> => {
  const password = "emulator-only-password";
  await getAuth(app).createUser({ email, password, emailVerified });

  const response = await fetch(
    `${authEmulatorUrl}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const { idToken } = (await response.json()) as { idToken: string };
  return idToken;
};

let ownerToken: string;

const newProject: CreateProjectRequest = {
  name: "Launch",
  description: "Ship the first version",
  status: "ACTIVE",
  priority: "HIGH",
  dueDate: "2026-11-20",
};

const createProject = async (
  overrides: Partial<CreateProjectRequest> = {},
): Promise<Project> => {
  const response = await callHandler(projectsHandler, {
    method: "POST",
    headers: { authorization: `Bearer ${ownerToken}` },
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
  return callHandler(projectHandler, {
    method,
    headers: { authorization: `Bearer ${ownerToken}` },
    query: { uuid },
    body,
  });
};

const listProjects = (
  query: Record<string, string> = {},
): ReturnType<typeof callHandler> => {
  return callHandler(projectsHandler, {
    method: "GET",
    headers: { authorization: `Bearer ${ownerToken}` },
    query,
  });
};

beforeAll(async () => {
  await clearUsers();
  ownerToken = await signIn("owner@example.com");
});

describe("projects API against the Firestore emulator", () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates, reads, updates and deletes a project", async () => {
    const created = await createProject();
    const { uid } = await getAuth(app).getUserByEmail("owner@example.com");
    expect(created).toMatchObject({
      ...newProject,
      uuid: expect.any(String),
      ownerUuid: uid,
    });

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

    const response = await listProjects({ status: "ACTIVE" });

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
      .set({ ...newProject, ownerUuid: valid.ownerUuid, status: "ARCHIVED" });

    const list = await listProjects();
    expect(list.body).toEqual([valid]);

    const single = await callProject("corrupt", "GET");
    expect(single.statusCode).toBe(500);
    expect(single.body).toEqual({
      error: { code: "INTERNAL", message: "Stored project is invalid" },
    });
  });
});

describe("authentication", () => {
  it("rejects a request without a token", async () => {
    const response = await callHandler(projectsHandler, { method: "GET" });

    expect(response.statusCode).toBe(401);
    expect(response.body).toMatchObject({
      error: { code: "UNAUTHENTICATED" },
    });
  });

  it("rejects a token that isn't a valid ID token", async () => {
    const response = await callHandler(projectsHandler, {
      method: "GET",
      headers: { authorization: "Bearer not-a-token" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("forbids a user whose email isn't verified", async () => {
    const token = await signIn("unverified@example.com", {
      emailVerified: false,
    });

    const response = await callHandler(projectsHandler, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(403);
    expect(response.body).toMatchObject({ error: { code: "FORBIDDEN" } });
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
