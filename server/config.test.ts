import { describe, expect, it } from "vitest";

import { ConfigError, loadServerConfig } from "./config.js";

const privateKey =
  "-----BEGIN PRIVATE KEY-----\\nsecret-key-body\\n-----END PRIVATE KEY-----\\n";

const validEnv = {
  FIREBASE_PROJECT_ID: "vista-test",
  FIREBASE_CLIENT_EMAIL: "server@vista-test.iam.gserviceaccount.com",
  FIREBASE_PRIVATE_KEY: privateKey,
};

const redisEnv = {
  UPSTASH_REDIS_REST_URL: "https://vista-test.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "redis-token",
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
      redis: null,
      environment: "development",
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
    ).toEqual({
      projectId: "demo-vista",
      credentials: null,
      redis: null,
      environment: "development",
    });
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

  it("returns the Redis credentials and the Vercel environment", () => {
    const config = loadServerConfig({
      ...validEnv,
      ...redisEnv,
      VERCEL_ENV: "preview",
    });

    expect(config.redis).toEqual({
      url: "https://vista-test.upstash.io",
      token: "redis-token",
    });
    expect(config.environment).toBe("preview");
  });

  it("turns rate limiting off outside deployments when Redis isn't set", () => {
    expect(
      loadServerConfig({ ...validEnv, VERCEL_ENV: "development" }).redis,
    ).toBeNull();
  });

  it("requires both Redis variables when one is set", () => {
    const error = loadError({
      ...validEnv,
      UPSTASH_REDIS_REST_URL: redisEnv.UPSTASH_REDIS_REST_URL,
    });

    expect(error.message).toBe(
      "Invalid server configuration: UPSTASH_REDIS_REST_TOKEN is required",
    );
  });

  it.each(["production", "preview"])(
    "requires Redis in a %s deployment",
    (vercelEnv) => {
      const error = loadError({ ...validEnv, VERCEL_ENV: vercelEnv });

      expect(error.message).toBe(
        "Invalid server configuration: UPSTASH_REDIS_REST_URL is required; " +
          "UPSTASH_REDIS_REST_TOKEN is required",
      );
    },
  );

  it("rejects a Redis URL that isn't http(s)", () => {
    const error = loadError({
      ...validEnv,
      ...redisEnv,
      UPSTASH_REDIS_REST_URL: "redis://vista-test.upstash.io:6379",
    });

    expect(error.message).toContain(
      "UPSTASH_REDIS_REST_URL must be an http(s) URL",
    );
    expect(error.message).not.toContain("vista-test.upstash.io");
  });
});
