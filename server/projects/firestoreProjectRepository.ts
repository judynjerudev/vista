import type {
  DocumentSnapshot,
  Firestore,
  Query,
} from "firebase-admin/firestore";

import { toCalendarDate } from "../../shared/calendarDate.js";
import type { Project } from "../../shared/projects/model.js";
import type { ProjectRepository } from "./projectRepository.js";

export const toProject = (snapshot: DocumentSnapshot): Project => {
  const data = snapshot.data() as Omit<Project, "uuid">;
  return { uuid: snapshot.id, ...data, dueDate: toCalendarDate(data.dueDate) };
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

      return snapshot.docs.map((d) => {
        return toProject(d);
      });
    },

    findByUuid: async (uuid) => {
      const snap = await projectsRef.doc(uuid).get();
      if (!snap.exists) {
        return undefined;
      }
      return toProject(snap);
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
        return { ...toProject(snap), ...changes };
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
