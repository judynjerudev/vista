import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";

import type { BrowserConfig } from "@/lib/config";

let auth: Auth | null = null;

export const getFirebaseAuth = (config: BrowserConfig): Auth => {
  if (auth) {
    return auth;
  }

  auth = getAuth(initializeApp(config.firebase));
  if (config.authEmulatorHost) {
    connectAuthEmulator(auth, `http://${config.authEmulatorHost}`, {
      disableWarnings: true,
    });
  }
  return auth;
};
