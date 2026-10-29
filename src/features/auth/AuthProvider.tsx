import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  GoogleAuthProvider,
  isSignInWithEmailLink,
  onIdTokenChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import type { User } from "firebase/auth";

import type { BrowserConfig } from "@/lib/config";
import { setTokenProvider, setUnauthorizedHandler } from "@/lib/http";
import { AuthContext } from "./authContext";
import type { AuthContextValue, AuthState, AuthUser } from "./authContext";
import {
  forgetEmailForSignIn,
  readEmailForSignIn,
  rememberEmailForSignIn,
  removeSignInLinkFromUrl,
} from "./emailLink";
import { isUnusableLinkError, toSignInErrorMessage } from "./errors";
import { getFirebaseAuth } from "./firebase";

const sessionExpiredNotice = "Your session has expired. Please sign in again.";

const toAuthUser = (user: User): AuthUser => {
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName,
  };
};

type AuthProviderProps = {
  config: BrowserConfig;
  children: ReactNode;
};

export const AuthProvider = ({ config, children }: AuthProviderProps) => {
  const auth = getFirebaseAuth(config);
  const [state, setState] = useState<AuthState>(() => {
    // A sign-in link opened without a saved email needs the email retyped.
    const needsEmail =
      isSignInWithEmailLink(auth, window.location.href) &&
      !readEmailForSignIn();
    return needsEmail ? { status: "confirmEmail" } : { status: "loading" };
  });
  // While a sign-in link is being used, "no user yet" doesn't mean signed out.
  const completingLink = useRef(false);
  // The link's code works once; StrictMode runs effects twice in development.
  const handledLink = useRef(false);

  useEffect(() => {
    // Every API request carries a fresh ID token. The SDK refreshes it
    // before it expires.
    const unregisterTokenProvider = setTokenProvider(async () => {
      return (await auth.currentUser?.getIdToken()) ?? null;
    });
    // The server has already rejected the token, so the user is signed out
    // either way: show the sign-in screen even if local sign-out fails.
    const unregisterUnauthorizedHandler = setUnauthorizedHandler(() => {
      void firebaseSignOut(auth)
        .catch((error: unknown) => {
          console.error("Sign-out after an expired session failed:", error);
        })
        .finally(() => {
          setState({ status: "signedOut", notice: sessionExpiredNotice });
        });
    });

    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setState((previous) => {
        if (user) {
          return { status: "signedIn", user: toAuthUser(user) };
        }
        if (completingLink.current || previous.status === "confirmEmail") {
          return previous;
        }
        // Keep a "session expired" notice when the sign-out caused it.
        const notice = previous.status === "signedOut" ? previous.notice : null;
        return { status: "signedOut", notice };
      });
    });

    return () => {
      unsubscribe();
      unregisterTokenProvider();
      unregisterUnauthorizedHandler();
    };
  }, [auth]);

  // Opening a sign-in link on the device that requested it signs in straight
  // away, using the saved email.
  useEffect(() => {
    const link = window.location.href;
    const email = readEmailForSignIn();
    if (handledLink.current || !email || !isSignInWithEmailLink(auth, link)) {
      return;
    }
    handledLink.current = true;

    completingLink.current = true;
    signInWithEmailLink(auth, email, link)
      .catch((error: unknown) => {
        setState({
          status: "signedOut",
          notice: toSignInErrorMessage(error),
        });
      })
      .finally(() => {
        completingLink.current = false;
        forgetEmailForSignIn();
        removeSignInLinkFromUrl();
      });
  }, [auth]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...state,

      signInWithGoogle: async () => {
        await signInWithPopup(auth, new GoogleAuthProvider());
      },

      sendSignInLink: async (email) => {
        await sendSignInLinkToEmail(auth, email, {
          // Must be on the Firebase project's list of authorized domains.
          url: `${window.location.origin}/`,
          handleCodeInApp: true,
        });
        rememberEmailForSignIn(email);
      },

      confirmEmailForSignInLink: async (email) => {
        try {
          await signInWithEmailLink(auth, email, window.location.href);
          forgetEmailForSignIn();
          removeSignInLinkFromUrl();
        } catch (error) {
          if (isUnusableLinkError(error)) {
            removeSignInLinkFromUrl();
            setState({
              status: "signedOut",
              notice: toSignInErrorMessage(error),
            });
            return;
          }
          // e.g. a mistyped email: let the user try again.
          throw error;
        }
      },

      cancelSignInLink: () => {
        removeSignInLinkFromUrl();
        setState({ status: "signedOut", notice: null });
      },

      // Throws if sign-out fails. The session is then still on this device,
      // so showing the sign-in screen would be misleading.
      signOut: async () => {
        await firebaseSignOut(auth);
        setState({ status: "signedOut", notice: null });
      },
    };
  }, [auth, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
