import { useState } from "react";
import {
  Logout as LogoutIcon,
  Notification as NotificationIcon,
} from "@carbon/icons-react";

export type HeaderUser = {
  email: string;
  displayName: string | null;
};

type HeaderProps = {
  title: string;
  user: HeaderUser;
  onSignOut: () => Promise<void>;
};

const getInitials = ({ displayName, email }: HeaderUser): string => {
  const words = (displayName ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    return words
      .slice(0, 2)
      .map((word) => {
        return word[0];
      })
      .join("")
      .toUpperCase();
  }
  return email.slice(0, 1).toUpperCase();
};

export const Header = ({ title, user, onSignOut }: HeaderProps) => {
  const [signOutFailed, setSignOutFailed] = useState(false);

  // If sign-out fails the user is still signed in, so say so rather than
  // pretending otherwise.
  const handleSignOut = async () => {
    setSignOutFailed(false);
    try {
      await onSignOut();
    } catch (error) {
      console.error("Sign-out failed:", error);
      setSignOutFailed(true);
    }
  };

  return (
    <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-black/[0.06] bg-[#f5f4ef] px-relaxed">
      <div>
        <h1 className="text-xl font-black leading-tight tracking-[-0.01em] text-gray-900">
          {title}
        </h1>
        <p className="text-xs-tiny font-bold uppercase tracking-[0.18em] text-gray-400/60">
          Project Management
        </p>
      </div>

      <div className="flex items-center gap-normal">
        {signOutFailed && (
          <p role="alert" className="text-xs text-red-600">
            Couldn't sign out. Try again.
          </p>
        )}
        <button className="focusable relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-black/[0.06] hover:text-gray-700">
          <NotificationIcon size={17} />
        </button>
        <div className="h-5 w-px bg-black/[0.08]" aria-hidden="true" />
        <div
          className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#5b4eff] text-[11px] font-bold tracking-wide text-white shadow-[0_0_0_2px_#f5f4ef,0_0_0_4px_rgba(91,78,255,0.3)]"
          title={user.email}
          aria-label={`Signed in as ${user.email}`}
        >
          {getInitials(user)}
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
          className="focusable flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-all hover:bg-black/[0.06] hover:text-gray-700"
        >
          <LogoutIcon size={17} />
        </button>
      </div>
    </header>
  );
};
