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
import { logError } from "../logger.js";
import type { ProjectRepository } from "./projectRepository.js";

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

export const toProject = (snapshot: DocumentSnapshot): Project | null => {
  const result = storedProjectSchema.safeParse(snapshot.data());

  if (!result.success) {
    const problems = result.error.issues.map((issue) => {
      return `${issue.path.join(".")}: ${issue.message}`;
    });
    logError(`Invalid project document ${snapshot.id}: ${problems.join("; ")}`);
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

const isOwnedBy = (snapshot: DocumentSnapshot, ownerUuid: string): boolean => {
  return snapshot.exists && snapshot.get("ownerUuid") === ownerUuid;
};

export const createFirestoreProjectRepository = (
  db: Firestore,
): ProjectRepository => {
  const projectsRef = db.collection("projects");

  return {
    findAll: async (ownerUuid, filters) => {
      let q: Query = projectsRef.where("ownerUuid", "==", ownerUuid);

      if (filters?.status) {
        q = q.where("status", "==", filters.status);
      }
      if (filters?.priority) {
        q = q.where("priority", "==", filters.priority);
      }

      const snapshot = await q.get();

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

    update: (uuid, ownerUuid, changes) => {
      return db.runTransaction(async (transaction) => {
        const ref = projectsRef.doc(uuid);
        const snap = await transaction.get(ref);
        if (!isOwnedBy(snap, ownerUuid)) {
          return undefined;
        }

        transaction.update(ref, changes);
        return { ...readProject(snap), ...changes };
      });
    },

    remove: (uuid, ownerUuid) => {
      return db.runTransaction(async (transaction) => {
        const ref = projectsRef.doc(uuid);
        const snap = await transaction.get(ref);
        if (!isOwnedBy(snap, ownerUuid)) {
          return false;
        }

        transaction.delete(ref);
        return true;
      });
    },
  };
};
