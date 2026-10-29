import { getAuth } from "firebase-admin/auth";

import { app } from "../firebase.js";
import { createAuthenticator } from "./authenticate.js";

// Verifies tokens against `FIREBASE_AUTH_EMULATOR_HOST` when it's set.
export const authenticate = createAuthenticator((idToken) => {
  return getAuth(app).verifyIdToken(idToken);
});
