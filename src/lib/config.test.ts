import { describe, expect, it } from "vitest";

import { ConfigError, loadBrowserConfig } from "./config";

const validEnv = {
  VITE_FIREBASE_API_KEY: "api-key",
  VITE_FIREBASE_AUTH_DOMAIN: "vista-test.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "vista-test",
  VITE_FIREBASE_APP_ID: "1:123:web:abc",
};

describe("loadBrowserConfig", () => {
  it("returns the Firebase web config", () => {
    expect(loadBrowserConfig(validEnv)).toEqual({
      firebase: {
        apiKey: "api-key",
        authDomain: "vista-test.firebaseapp.com",
        projectId: "vista-test",
        appId: "1:123:web:abc",
      },
      authEmulatorHost: null,
    });
  });

  it("reads the Auth emulator host when set", () => {
    expect(
      loadBrowserConfig({
        ...validEnv,
        VITE_FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
      }).authEmulatorHost,
    ).toBe("127.0.0.1:9099");
  });

  it("treats a blank optional variable as not set", () => {
    expect(
      loadBrowserConfig({ ...validEnv, VITE_FIREBASE_AUTH_EMULATOR_HOST: " " })
        .authEmulatorHost,
    ).toBeNull();
  });

  it("lists every missing variable", () => {
    expect(() => {
      return loadBrowserConfig({ VITE_FIREBASE_API_KEY: " " });
    }).toThrow(
      new ConfigError([
        "VITE_FIREBASE_API_KEY is required",
        "VITE_FIREBASE_AUTH_DOMAIN is required",
        "VITE_FIREBASE_PROJECT_ID is required",
        "VITE_FIREBASE_APP_ID is required",
      ]),
    );
  });
});
