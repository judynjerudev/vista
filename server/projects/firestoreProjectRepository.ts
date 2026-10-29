import type {
  DocumentSnapshot,
  Firestore,
  Query,
} from "firebase-admin/firestore";

import { z } from "zod";

import { toCalendarDate } from "../../shared/calendarDate.js";
import type { Project } from "../../shared/projects/model.js";
import {
  projectPriorities,
  projectStatuses,
} from "../../shared/projects/model.js";
import { AppError } from "../errors.js";
import type { ProjectRepository } from "./projectRepository.js";

// What a stored document must look like. Older documents may hold a
// timestamp due date, so it is normalized rather than rejected.
const storedProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  status: z.enum(projectStatuses),
  priority: z.enum(projectPriorities),
  ownerUuid: z.string(),
  dueDate: z.unknown().transform((value) => {
    return typeof value === "string" ? toCalendarDate(value) : null;
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Returns `null` for a document that doesn't match, after logging which
// fields are wrong. Field values are never logged.
export const toProject = (snapshot: DocumentSnapshot): Project | null => {
  const result = storedProjectSchema.safeParse(snapshot.data());

  if (!result.success) {
    const problems = result.error.issues.map((issue) => {
      return `${issue.path.join(".")}: ${issue.message}`;
    });
    console.error(
      `Invalid project document ${snapshot.id}: ${problems.join("; ")}`,
    );
    return null;
  }

  return { uuid: snapshot.id, ...result.data };
};

const readProject = (snapshot: DocumentSnapshot): Project => {
  const project = toProject(snapshot);
  if (!project) {
    throw new AppError("INTERNAL", "Stored project is invalid");
  }
  return project;
};

export const createFirestoreProjectRepository = (
  db: Firestore,
): ProjectRepository => {
  const projectsRef = db.collection("projects");

  return {
    findAll: async (filters) => {
      let q: Query = projectsRef;

      if (filters?.status) {
        q = q.where("status", "==", filters.status);
      }
      if (filters?.priority) {
        q = q.where("priority", "==", filters.priority);
      }

      const snapshot = await q.get();

      // One corrupt document shouldn't hide every other project.
      return snapshot.docs.flatMap((d) => {
        return toProject(d) ?? [];
      });
    },

    findByUuid: async (uuid) => {
      const snap = await projectsRef.doc(uuid).get();
      if (!snap.exists) {
        return undefined;
      }
      return readProject(snap);
    },

    insert: async (data) => {
      const ref = await projectsRef.add(data);
      return { uuid: ref.id, ...data };
    },

    // The read and the write run in one transaction, so a concurrent delete
    // can't slip in between the existence check and the write.
    update: (uuid, changes) => {
      return db.runTransaction(async (transaction) => {
        const ref = projectsRef.doc(uuid);
        const snap = await transaction.get(ref);
        if (!snap.exists) {
          return undefined;
        }

        transaction.update(ref, changes);
        return { ...readProject(snap), ...changes };
      });
    },

    remove: (uuid) => {
      return db.runTransaction(async (transaction) => {
        const ref = projectsRef.doc(uuid);
        const snap = await transaction.get(ref);
        if (!snap.exists) {
          return false;
        }

        transaction.delete(ref);
        return true;
      });
    },
  };
};
