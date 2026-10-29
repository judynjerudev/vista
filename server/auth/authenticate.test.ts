import type { VercelRequest } from "@vercel/node";
import { describe, expect, it, vi } from "vitest";

import type { TokenVerifier, VerifiedToken } from "./authenticate.js";
import { createAuthenticator } from "./authenticate.js";

const requestWithAuthorization = (authorization?: string): VercelRequest => {
  return { headers: { authorization } } as VercelRequest;
};

const verifierReturning = (token: VerifiedToken): TokenVerifier => {
  return vi.fn(async () => {
    return token;
  });
};

const verifiedToken: VerifiedToken = {
  uid: "user-1",
  email: "user@example.com",
  email_verified: true,
};

describe("authenticate", () => {
  it("returns the user for a valid token", async () => {
    const verify = verifierReturning(verifiedToken);
    const authenticate = createAuthenticator(verify);

    const user = await authenticate(
      requestWithAuthorization("Bearer id-token"),
    );

    expect(user).toEqual({ uid: "user-1", email: "user@example.com" });
    expect(verify).toHaveBeenCalledWith("id-token");
  });

  it.each([
    ["no header", undefined],
    ["an empty header", ""],
    ["another scheme", "Basic dXNlcjpwYXNz"],
    ["a missing token", "Bearer "],
  ])("rejects a request with %s", async (_, authorization) => {
    const verify = verifierReturning(verifiedToken);
    const authenticate = createAuthenticator(verify);

    await expect(
      authenticate(requestWithAuthorization(authorization)),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    expect(verify).not.toHaveBeenCalled();
  });

  it("rejects a token the verifier refuses", async () => {
    const authenticate = createAuthenticator(async () => {
      throw Object.assign(new Error("Token expired"), {
        code: "auth/id-token-expired",
      });
    });

    await expect(
      authenticate(requestWithAuthorization("Bearer expired")),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("lets other verification failures through as server errors", async () => {
    const outage = new Error("Couldn't fetch signing keys");
    const authenticate = createAuthenticator(async () => {
      throw outage;
    });

    await expect(
      authenticate(requestWithAuthorization("Bearer id-token")),
    ).rejects.toBe(outage);
  });

  it.each([
    ["an unverified email", { ...verifiedToken, email_verified: false }],
    ["no email", { uid: "user-1" }],
  ])("forbids a user with %s", async (_, token) => {
    const authenticate = createAuthenticator(verifierReturning(token));

    await expect(
      authenticate(requestWithAuthorization("Bearer id-token")),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
