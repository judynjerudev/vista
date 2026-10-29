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
  "auth/operation-not-allowed": "This sign-in method isn't enabled.",
  "auth/invalid-email":
    "That email doesn't match the one the sign-in link was sent to.",
  "auth/missing-email": "Enter your email address.",
  "auth/invalid-action-code":
    "This sign-in link is invalid or has already been used. Request a new one.",
  "auth/expired-action-code":
    "This sign-in link has expired. Request a new one.",
  "auth/quota-exceeded":
    "Too many sign-in emails were sent today. Try again tomorrow or use Google.",
};

// The link itself is unusable, so asking for the email again won't help.
export const isUnusableLinkError = (error: unknown): boolean => {
  return (
    error instanceof FirebaseError &&
    (error.code === "auth/invalid-action-code" ||
      error.code === "auth/expired-action-code")
  );
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
