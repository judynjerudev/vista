import { db } from "../firebase.js";
import { createFirestoreProjectRepository } from "./firestoreProjectRepository.js";
import { createProjectService } from "./projectService.js";

export const projectService = createProjectService(
  createFirestoreProjectRepository(db),
);
