import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import type { User } from "firebase/auth";

import type { BrowserConfig } from "@/lib/config";
import { setTokenProvider, setUnauthorizedHandler } from "@/lib/http";
import { AuthContext } from "./authContext";
import type { AuthContextValue, AuthState, AuthUser } from "./authContext";
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
  const [state, setState] = useState<AuthState>({ status: "loading" });

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

  const value = useMemo<AuthContextValue>(() => {
    return {
      ...state,
      signInWithGoogle: async () => {
        await signInWithPopup(auth, new GoogleAuthProvider());
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
