import { cert, getApps, initializeApp } from "firebase-admin/app";
import type { App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { loadServerConfig } from "./config.js";

// Throws on a cold start if the environment is misconfigured, naming every
// bad variable, instead of failing later with a confusing Firestore error.
const config = loadServerConfig(process.env);

const getApp = (): App => {
  const [existingApp] = getApps();
  if (existingApp) {
    return existingApp;
  }

  // Without credentials the SDK talks to the emulator in
  // `FIRESTORE_EMULATOR_HOST`, which the config requires in that case.
  return initializeApp({
    projectId: config.projectId,
    ...(config.credentials && { credential: cert(config.credentials) }),
  });
};

export const app = getApp();
export const db = getFirestore(app);
