// The email a sign-in link was sent to, kept on this device until the link is
// opened. If the link is opened elsewhere, the user is asked to type the email
// again: otherwise anyone could send you a link that signs you into *their*
// account.
const storageKey = "vista.emailForSignIn";

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Storage can be unavailable (private browsing, blocked site data). Sign-in
// still works then; the user is just asked for their email again.
export const rememberEmailForSignIn = (
  email: string,
  storage: KeyValueStorage = window.localStorage,
): void => {
  try {
    storage.setItem(storageKey, email);
  } catch {
    // Ignored: see above.
  }
};

export const readEmailForSignIn = (
  storage: KeyValueStorage = window.localStorage,
): string | null => {
  try {
    return storage.getItem(storageKey);
  } catch {
    return null;
  }
};

export const forgetEmailForSignIn = (
  storage: KeyValueStorage = window.localStorage,
): void => {
  try {
    storage.removeItem(storageKey);
  } catch {
    // Ignored: see above.
  }
};

// The link's one-time code is in the query string. Removing it keeps it out
// of the browser history and of anything the user copies from the address bar.
export const removeSignInLinkFromUrl = (
  location: Pick<Location, "pathname" | "hash"> = window.location,
  history: Pick<History, "replaceState"> = window.history,
): void => {
  history.replaceState(null, "", `${location.pathname}${location.hash}`);
};
