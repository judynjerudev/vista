import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "../authContext";
import { toSignInErrorMessage } from "../errors";

export const SignInScreen = () => {
  const auth = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const notice = auth.status === "signedOut" ? auth.notice : null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await auth.signInWithGoogle();
    } catch (signInError) {
      setError(toSignInErrorMessage(signInError));
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#f5f4ef] p-relaxed">
      <div className="w-full max-w-sm rounded-lg bg-white p-relaxed shadow-xl">
        <h1 className="text-lg font-semibold text-gray-900">Sign in</h1>
        <p className="mt-xsmall text-sm text-gray-600">
          Sign in to see and manage your projects.
        </p>

        {notice && (
          <p
            role="status"
            className="mt-normal rounded-md bg-amber-50 px-normal py-small text-sm text-amber-800"
          >
            {notice}
          </p>
        )}

        <Button
          variant="secondary"
          text={signingIn ? "Signing in..." : "Continue with Google"}
          className="mt-relaxed w-full justify-center"
          disabled={signingIn}
          onClick={handleGoogleSignIn}
        />

        {error && (
          <p role="alert" className="mt-normal text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
