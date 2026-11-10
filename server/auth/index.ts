import { getAuth } from "firebase-admin/auth";

import { app } from "../firebase.js";
import { createAuthenticator } from "./authenticate.js";

export const authenticate = createAuthenticator((idToken) => {
  return getAuth(app).verifyIdToken(idToken);
});
