import { FirebaseError } from "firebase/app";

// Firebase error codes the user can act on. Anything else gets a generic
// message; the details go to the console.
const messagesByCode: Record<string, string> = {
  "auth/popup-blocked":
    "Your browser blocked the sign-in window. Allow pop-ups and try again.",
  "auth/network-request-failed":
    "Couldn't reach the sign-in service. Check your connection.",
  "auth/too-many-requests": "Too many attempts. Please wait and try again.",
  "auth/unauthorized-domain": "Sign-in isn't enabled for this site.",
};

// The user closed the window or started another sign-in; nothing to report.
const cancelledCodes = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

export const toSignInErrorMessage = (error: unknown): string | null => {
  if (error instanceof FirebaseError) {
    if (cancelledCodes.has(error.code)) {
      return null;
    }
    if (messagesByCode[error.code]) {
      return messagesByCode[error.code];
    }
  }
  console.error("Sign-in failed:", error);
  return "Sign-in failed. Please try again.";
};
