import { z } from "zod";

const required = (): z.ZodString => {
  return z.string({ error: "is required" }).trim().min(1, "is required");
};

// `VAR=` in a .env file or a blank value in Vercel arrives as "", which means
// "not set" here. Whether a missing credential is a problem is decided by
// `findMissingCredentials`, which knows about the emulator.
const optional = <T extends z.ZodType>(schema: T) => {
  return z.preprocess((value) => {
    return typeof value === "string" && value.trim() === "" ? undefined : value;
  }, schema.optional());
};

const serverEnvSchema = z.object({
  FIREBASE_PROJECT_ID: required(),
  FIREBASE_CLIENT_EMAIL: optional(
    z
      .string()
      .trim()
      .pipe(z.email({ error: "must be an email address" })),
  ),
  FIREBASE_PRIVATE_KEY: optional(
    z
      .string()
      // Vercel and .env files store the key on one line with escaped newlines.
      .transform((key) => {
        return key.replace(/\\n/g, "\n");
      })
      .refine(
        (key) => {
          return key.includes("-----BEGIN PRIVATE KEY-----");
        },
        { error: "must be a PEM private key" },
      ),
  ),
  FIRESTORE_EMULATOR_HOST: optional(z.string().trim()),
});

const credentialVariables = [
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

// The emulator needs no credentials; everywhere else they are required.
const findMissingCredentials = (
  env: Record<string, string | undefined>,
): string[] => {
  if (env.FIRESTORE_EMULATOR_HOST?.trim()) {
    return [];
  }
  return credentialVariables
    .filter((name) => {
      return !env[name]?.trim();
    })
    .map((name) => {
      return `${name} is required`;
    });
};

const emulatorVariables = [
  "FIRESTORE_EMULATOR_HOST",
  "FIREBASE_AUTH_EMULATOR_HOST",
] as const;

// With `FIREBASE_AUTH_EMULATOR_HOST` set, the Admin SDK accepts unsigned ID
// tokens, so anyone could act as any user. Deployments use the real Firebase
// project, so emulator variables there are always a mistake.
const findEmulatorsInDeployment = (
  env: Record<string, string | undefined>,
): string[] => {
  if (env.VERCEL_ENV !== "production" && env.VERCEL_ENV !== "preview") {
    return [];
  }
  return emulatorVariables
    .filter((name) => {
      return env[name]?.trim();
    })
    .map((name) => {
      return `${name} must not be set in a ${env.VERCEL_ENV} deployment`;
    });
};

export type FirebaseCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

export type ServerConfig = {
  projectId: string;
  // `null` only when running against the Firestore emulator.
  credentials: FirebaseCredentials | null;
};

export class ConfigError extends Error {
  constructor(problems: string[]) {
    super(`Invalid server configuration: ${problems.join("; ")}`);
    this.name = "ConfigError";
  }
}

export const loadServerConfig = (
  env: Record<string, string | undefined>,
): ServerConfig => {
  const result = serverEnvSchema.safeParse(env);
  // Only variable names reach the message, never their values.
  const problems = [
    ...new Set([
      ...(result.error?.issues ?? []).map((issue) => {
        return `${issue.path.join(".")} ${issue.message}`;
      }),
      ...findMissingCredentials(env),
      ...findEmulatorsInDeployment(env),
    ]),
  ];

  if (!result.success || problems.length > 0) {
    throw new ConfigError(problems);
  }

  const {
    FIREBASE_PROJECT_ID: projectId,
    FIREBASE_CLIENT_EMAIL: clientEmail,
    FIREBASE_PRIVATE_KEY: privateKey,
  } = result.data;

  return {
    projectId,
    credentials:
      clientEmail && privateKey ? { projectId, clientEmail, privateKey } : null,
  };
};
