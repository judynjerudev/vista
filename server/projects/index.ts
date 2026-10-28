import { db } from "../firebase.js";
import { createFirestoreProjectRepository } from "./firestoreProjectRepository.js";

export const projectRepository = createFirestoreProjectRepository(db);
