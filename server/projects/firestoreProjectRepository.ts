import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import type { DocumentSnapshot, Firestore } from "firebase/firestore";

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
  const projectsRef = collection(db, "projects");

  return {
    findAll: async (filters) => {
      const constraints = [];

      if (filters?.status) {
        constraints.push(where("status", "==", filters.status));
      }
      if (filters?.priority) {
        constraints.push(where("priority", "==", filters.priority));
      }

      const q =
        constraints.length > 0
          ? query(projectsRef, ...constraints)
          : projectsRef;
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => {
        return toProject(d);
      });
    },

    findByUuid: async (uuid) => {
      const snap = await getDoc(doc(db, "projects", uuid));
      if (!snap.exists()) {
        return undefined;
      }
      return toProject(snap);
    },

    insert: async (data) => {
      const ref = await addDoc(projectsRef, data);
      return { uuid: ref.id, ...data };
    },

    update: async (uuid, changes) => {
      const ref = doc(db, "projects", uuid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        return undefined;
      }

      await updateDoc(ref, changes);
      return { ...toProject(snap), ...changes };
    },

    remove: async (uuid) => {
      const ref = doc(db, "projects", uuid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        return false;
      }
      await deleteDoc(ref);
      return true;
    },
  };
};
