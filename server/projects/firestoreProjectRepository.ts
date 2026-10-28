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

import type { Project } from "../../shared/projects/model.js";
import type { ProjectRepository } from "./projectRepository.js";

const toProject = (snapshot: DocumentSnapshot): Project => {
  return { uuid: snapshot.id, ...snapshot.data() } as Project;
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

    create: async (input) => {
      const now = new Date().toISOString();
      const data = { ...input, createdAt: now, updatedAt: now };
      const ref = await addDoc(projectsRef, data);
      return { uuid: ref.id, ...data };
    },

    update: async (uuid, input) => {
      const ref = doc(db, "projects", uuid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        return undefined;
      }

      const updates = { ...input, updatedAt: new Date().toISOString() };
      await updateDoc(ref, updates);
      return { ...toProject(snap), ...updates };
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
