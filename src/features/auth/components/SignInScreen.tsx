import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "../authContext";
import { toSignInErrorMessage } from "../errors";

type CardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

const Card = ({ title, description, children }: CardProps) => {
  return (
    <div className="flex h-screen items-center justify-center bg-[#f5f4ef] p-relaxed">
      <div className="w-full max-w-sm rounded-lg bg-white p-relaxed shadow-xl">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <p className="mt-xsmall text-sm text-gray-600">{description}</p>
        {children}
      </div>
    </div>
  );
};

const ErrorMessage = ({ message }: { message: string | null }) => {
  if (!message) {
    return null;
  }
  return (
    <p role="alert" className="mt-normal text-sm text-red-600">
      {message}
    </p>
  );
};

// Runs a sign-in action, tracking whether it's in progress and its error.
const useSignInAction = () => {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const run = async (action: () => Promise<void>): Promise<boolean> => {
    setError(null);
    setPending(true);
    try {
      await action();
      return true;
    } catch (actionError) {
      setError(toSignInErrorMessage(actionError));
      return false;
    } finally {
      setPending(false);
    }
  };

  return { error, pending, run };
};

const ConfirmEmail = () => {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const { error, pending, run } = useSignInAction();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void run(() => {
      return auth.confirmEmailForSignInLink(email.trim());
    });
  };

  return (
    <Card
      title="Confirm your email"
      description="This sign-in link was opened on a different device or browser. Enter the email address you requested it with."
    >
      <form onSubmit={handleSubmit} className="mt-relaxed space-y-4">
        <Input
          label="Email"
          id="confirm-email"
          type="email"
          autoComplete="email"
          value={email}
          required
          onChange={(event) => {
            return setEmail(event.target.value);
          }}
        />
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            text="Cancel"
            onClick={auth.cancelSignInLink}
          />
          <Button
            type="submit"
            variant="primary"
            text={pending ? "Signing in..." : "Sign in"}
            disabled={pending}
          />
        </div>
      </form>
      <ErrorMessage message={error} />
    </Card>
  );
};

export const SignInScreen = () => {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const google = useSignInAction();
  const emailLink = useSignInAction();

  if (auth.status === "confirmEmail") {
    return <ConfirmEmail />;
  }

  const notice = auth.status === "signedOut" ? auth.notice : null;

  const handleSendLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = email.trim();
    const sent = await emailLink.run(() => {
      return auth.sendSignInLink(address);
    });
    if (sent) {
      setLinkSentTo(address);
    }
  };

  if (linkSentTo) {
    return (
      <Card
        title="Check your inbox"
        description={`We sent a sign-in link to ${linkSentTo}. Open it on this device to sign in.`}
      >
        <Button
          variant="tertiary"
          text="Use a different email"
          className="mt-relaxed"
          onClick={() => {
            return setLinkSentTo(null);
          }}
        />
      </Card>
    );
  }

  return (
    <Card
      title="Sign in"
      description="Sign in to see and manage your projects."
    >
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
        text={google.pending ? "Signing in..." : "Continue with Google"}
        className="mt-relaxed w-full justify-center"
        disabled={google.pending}
        onClick={() => {
          void google.run(auth.signInWithGoogle);
        }}
      />
      <ErrorMessage message={google.error} />

      <div className="my-relaxed flex items-center gap-normal text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200" aria-hidden="true" />
        or
        <div className="h-px flex-1 bg-gray-200" aria-hidden="true" />
      </div>

      <form onSubmit={handleSendLink} className="space-y-4">
        <Input
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          required
          onChange={(event) => {
            return setEmail(event.target.value);
          }}
        />
        <Button
          type="submit"
          variant="primary"
          text={emailLink.pending ? "Sending..." : "Email me a sign-in link"}
          className="w-full justify-center"
          disabled={emailLink.pending}
        />
      </form>
      <ErrorMessage message={emailLink.error} />
    </Card>
  );
};
