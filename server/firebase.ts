import { cert, getApps, initializeApp } from "firebase-admin/app";
import type { App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { serverConfig } from "./serverConfig.js";

const getApp = (): App => {
  const [existingApp] = getApps();
  if (existingApp) {
    return existingApp;
  }

  return initializeApp({
    projectId: serverConfig.projectId,
    ...(serverConfig.credentials && {
      credential: cert(serverConfig.credentials),
    }),
  });
};

export const app = getApp();
export const db = getFirestore(app);
