import { z } from "zod";

const required = (): z.ZodString => {
  return z.string({ error: "is required" }).trim().min(1, "is required");
};

// `VAR=` in a .env file reaches the app as "", which means "not set" here.
const optional = () => {
  return z.preprocess((value) => {
    return typeof value === "string" && value.trim() === "" ? undefined : value;
  }, z.string().trim().optional());
};

// The Firebase web config is public by design: it identifies the project to
// the browser SDK and is protected by API key restrictions and server-side
// checks, not by being secret.
const browserEnvSchema = z.object({
  VITE_FIREBASE_API_KEY: required(),
  VITE_FIREBASE_AUTH_DOMAIN: required(),
  VITE_FIREBASE_PROJECT_ID: required(),
  VITE_FIREBASE_APP_ID: required(),
  VITE_FIREBASE_AUTH_EMULATOR_HOST: optional(),
});

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

export type BrowserConfig = {
  firebase: FirebaseWebConfig;
  // Set to use the local Auth emulator instead of real Firebase Auth.
  authEmulatorHost: string | null;
};

export class ConfigError extends Error {
  problems: string[];

  constructor(problems: string[]) {
    super(`Invalid app configuration: ${problems.join("; ")}`);
    this.name = "ConfigError";
    this.problems = problems;
  }
}

export const loadBrowserConfig = (
  env: Record<string, unknown>,
): BrowserConfig => {
  const result = browserEnvSchema.safeParse(env);

  if (!result.success) {
    throw new ConfigError(
      result.error.issues.map((issue) => {
        return `${issue.path.join(".")} ${issue.message}`;
      }),
    );
  }

  const { data } = result;
  return {
    firebase: {
      apiKey: data.VITE_FIREBASE_API_KEY,
      authDomain: data.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: data.VITE_FIREBASE_PROJECT_ID,
      appId: data.VITE_FIREBASE_APP_ID,
    },
    authEmulatorHost: data.VITE_FIREBASE_AUTH_EMULATOR_HOST ?? null,
  };
};
