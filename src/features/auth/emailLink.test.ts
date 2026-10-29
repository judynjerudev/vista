import { describe, expect, it, vi } from "vitest";

import {
  forgetEmailForSignIn,
  readEmailForSignIn,
  rememberEmailForSignIn,
  removeSignInLinkFromUrl,
} from "./emailLink";

const createStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => {
      return values.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
};

const unavailableStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("SecurityError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

describe("email for sign-in", () => {
  it("remembers the email until it is forgotten", () => {
    const storage = createStorage();

    rememberEmailForSignIn("judy@example.com", storage);
    expect(readEmailForSignIn(storage)).toBe("judy@example.com");

    forgetEmailForSignIn(storage);
    expect(readEmailForSignIn(storage)).toBeNull();
  });

  it("treats unavailable storage as having no saved email", () => {
    expect(() => {
      rememberEmailForSignIn("judy@example.com", unavailableStorage);
      forgetEmailForSignIn(unavailableStorage);
    }).not.toThrow();
    expect(readEmailForSignIn(unavailableStorage)).toBeNull();
  });
});

describe("removeSignInLinkFromUrl", () => {
  it("drops the query string and keeps the path and hash", () => {
    const history = { replaceState: vi.fn() };

    removeSignInLinkFromUrl({ pathname: "/", hash: "#projects" }, history);

    expect(history.replaceState).toHaveBeenCalledWith(null, "", "/#projects");
  });
});
