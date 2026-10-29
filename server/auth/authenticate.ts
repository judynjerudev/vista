import type { VercelRequest } from "@vercel/node";

import { AppError } from "../errors.js";

export type AuthUser = {
  uid: string;
  email: string;
};

// The claims we use from a verified Firebase ID token.
export type VerifiedToken = {
  uid: string;
  email?: string;
  email_verified?: boolean;
};

export type TokenVerifier = (idToken: string) => Promise<VerifiedToken>;
export type Authenticator = (request: VercelRequest) => Promise<AuthUser>;

const bearerPattern = /^Bearer ([^\s]+)$/i;

// Errors the Admin SDK raises for a bad token (expired, malformed, revoked,
// wrong project). Anything else, such as failing to fetch Google's signing
// keys, is a server problem rather than the user's.
const isTokenError = (error: unknown): boolean => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && code.startsWith("auth/");
};

export const createAuthenticator = (verify: TokenVerifier): Authenticator => {
  return async (request) => {
    const match = bearerPattern.exec(request.headers.authorization ?? "");
    if (!match) {
      throw new AppError("UNAUTHENTICATED", "Sign in required");
    }

    let token: VerifiedToken;
    try {
      token = await verify(match[1]);
    } catch (error) {
      if (isTokenError(error)) {
        throw new AppError(
          "UNAUTHENTICATED",
          "Your session is invalid or has expired",
        );
      }
      throw error;
    }

    // Google and email-link accounts are always verified. This guards against
    // a weaker sign-in method being enabled by mistake.
    if (!token.email || token.email_verified !== true) {
      throw new AppError("FORBIDDEN", "A verified email address is required");
    }

    return { uid: token.uid, email: token.email };
  };
};
