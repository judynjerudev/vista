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
    const needsEmail =
      isSignInWithEmailLink(auth, window.location.href) &&
      !readEmailForSignIn();
    return needsEmail ? { status: "confirmEmail" } : { status: "loading" };
  });
  const completingLink = useRef(false);
  const handledLink = useRef(false);

  useEffect(() => {
    const unregisterTokenProvider = setTokenProvider(async () => {
      return (await auth.currentUser?.getIdToken()) ?? null;
    });
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
          throw error;
        }
      },

      cancelSignInLink: () => {
        removeSignInLinkFromUrl();
        setState({ status: "signedOut", notice: null });
      },

      signOut: async () => {
        await firebaseSignOut(auth);
        setState({ status: "signedOut", notice: null });
      },
    };
  }, [auth, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
