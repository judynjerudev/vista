import { z } from "zod";

const required = (): z.ZodString => {
  return z.string({ error: "is required" }).trim().min(1, "is required");
};

const serverEnvSchema = z.object({
  FIREBASE_PROJECT_ID: required(),
  FIREBASE_CLIENT_EMAIL: required()
    .pipe(z.email({ error: "must be an email address" }))
    .optional(),
  FIREBASE_PRIVATE_KEY: required()
    // Vercel and .env files store the key on one line with escaped newlines.
    .transform((key) => {
      return key.replace(/\\n/g, "\n");
    })
    .refine(
      (key) => {
        return key.includes("-----BEGIN PRIVATE KEY-----");
      },
      { error: "must be a PEM private key" },
    )
    .optional(),
  FIRESTORE_EMULATOR_HOST: required().optional(),
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
