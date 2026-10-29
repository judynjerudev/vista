import { createContext, useContext } from "react";

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string | null;
};

export type AuthState =
  | { status: "loading" }
  | { status: "signedOut"; notice: string | null }
  // A sign-in link was opened on a device that didn't request it.
  | { status: "confirmEmail" }
  | { status: "signedIn"; user: AuthUser };

export type AuthContextValue = AuthState & {
  signInWithGoogle: () => Promise<void>;
  sendSignInLink: (email: string) => Promise<void>;
  confirmEmailForSignInLink: (email: string) => Promise<void>;
  cancelSignInLink: () => void;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return value;
};
