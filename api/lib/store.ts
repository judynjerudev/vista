import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import type { Project } from '../../shared/types.js';
import type { CreateProjectInput, UpdateProjectInput, ProjectFilters } from './schemas.js';
import { db } from './firebase.js';

const projectsRef = collection(db, 'projects');

export async function findAll(filters?: ProjectFilters): Promise<Project[]> {
  const constraints = [];

  if (filters?.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters?.priority) {
    constraints.push(where('priority', '==', filters.priority));
  }

  const q = constraints.length > 0 ? query(projectsRef, ...constraints) : projectsRef;
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({ uuid: d.id, ...d.data() }) as Project);
}

export async function findByUuid(uuid: string): Promise<Project | undefined> {
  const snap = await getDoc(doc(db, 'projects', uuid));
  if (!snap.exists()) {
    return undefined;
  }
  return { uuid: snap.id, ...snap.data() } as Project;
}

export async function create(input: CreateProjectInput): Promise<Project> {
  const now = new Date().toISOString();
  const data = { ...input, createdAt: now, updatedAt: now };
  const ref = await addDoc(projectsRef, data);
  return { uuid: ref.id, ...data };
}

export async function update(
  uuid: string,
  input: UpdateProjectInput,
): Promise<Project | undefined> {
  const ref = doc(db, 'projects', uuid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return undefined;

  const updates = { ...input, updatedAt: new Date().toISOString() };
  await updateDoc(ref, updates);
  return { uuid, ...snap.data(), ...updates } as Project;
}

export async function remove(uuid: string): Promise<boolean> {
  const ref = doc(db, 'projects', uuid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  await deleteDoc(ref);
  return true;
}
