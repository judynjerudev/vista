import { describe, expect, it } from "vitest";

import { ConfigError, loadServerConfig } from "./config.js";

const privateKey =
  "-----BEGIN PRIVATE KEY-----\\nsecret-key-body\\n-----END PRIVATE KEY-----\\n";

const validEnv = {
  FIREBASE_PROJECT_ID: "vista-test",
  FIREBASE_CLIENT_EMAIL: "server@vista-test.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY: privateKey,
};

const loadError = (env: Record<string, string | undefined>): ConfigError => {
  try {
    loadServerConfig(env);
  } catch (error) {
    return error as ConfigError;
  }
  throw new Error("Expected loadServerConfig to throw");
};

describe("loadServerConfig", () => {
  it("returns service account credentials", () => {
    expect(loadServerConfig(validEnv)).toEqual({
      projectId: "vista-test",
      credentials: {
        projectId: "vista-test",
        clientEmail: "server@vista-test.iam.gserviceaccount.com",
        privateKey:
          "-----BEGIN PRIVATE KEY-----\nsecret-key-body\n-----END PRIVATE KEY-----\n",
      },
    });
  });

  it("lists every missing variable in one error", () => {
    const error = loadError({});

    expect(error).toBeInstanceOf(ConfigError);
    expect(error.message).toBe(
      "Invalid server configuration: FIREBASE_PROJECT_ID is required; " +
        "FIREBASE_CLIENT_EMAIL is required; FIREBASE_PRIVATE_KEY is required",
    );
  });

  it("treats a blank variable as missing", () => {
    expect(
      loadError({ ...validEnv, FIREBASE_PROJECT_ID: "  " }).message,
    ).toContain("FIREBASE_PROJECT_ID is required");
  });

  it("rejects malformed values without echoing them", () => {
    const error = loadError({
      ...validEnv,
      FIREBASE_CLIENT_EMAIL: "not-an-email",
      FIREBASE_PRIVATE_KEY: "secret-key-body",
    });

    expect(error.message).toContain(
      "FIREBASE_CLIENT_EMAIL must be an email address",
    );
    expect(error.message).toContain(
      "FIREBASE_PRIVATE_KEY must be a PEM private key",
    );
    expect(error.message).not.toContain("not-an-email");
    expect(error.message).not.toContain("secret-key-body");
  });

  it("treats blank optional variables as not set", () => {
    expect(
      loadServerConfig({ ...validEnv, FIRESTORE_EMULATOR_HOST: "" }),
    ).toEqual(loadServerConfig(validEnv));
  });

  it("allows blank credentials when using the emulator", () => {
    expect(
      loadServerConfig({
        FIREBASE_PROJECT_ID: "demo-vista",
        FIREBASE_CLIENT_EMAIL: "",
        FIREBASE_PRIVATE_KEY: " ",
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      }).credentials,
    ).toBeNull();
  });

  it("needs no credentials when using the Firestore emulator", () => {
    expect(
      loadServerConfig({
        FIREBASE_PROJECT_ID: "demo-vista",
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
      }),
    ).toEqual({ projectId: "demo-vista", credentials: null });
  });

  it.each(["production", "preview"])(
    "refuses emulator variables in a %s deployment",
    (vercelEnv) => {
      const error = loadError({
        ...validEnv,
        VERCEL_ENV: vercelEnv,
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
        FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      });

      expect(error.message).toContain(
        `FIRESTORE_EMULATOR_HOST must not be set in a ${vercelEnv} deployment`,
      );
      expect(error.message).toContain(
        `FIREBASE_AUTH_EMULATOR_HOST must not be set in a ${vercelEnv} deployment`,
      );
    },
  );

  it("allows emulator variables under `vercel dev`", () => {
    expect(
      loadServerConfig({
        FIREBASE_PROJECT_ID: "demo-vista",
        VERCEL_ENV: "development",
        FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
        FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      }).credentials,
    ).toBeNull();
  });
});
