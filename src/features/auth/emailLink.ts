const storageKey = "vista.emailForSignIn";

type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const withStorageFallback = <T>(action: () => T, fallback: T): T => {
  try {
    return action();
  } catch {
    return fallback;
  }
};

export const rememberEmailForSignIn = (
  email: string,
  storage: KeyValueStorage = window.localStorage,
): void => {
  withStorageFallback(() => {
    storage.setItem(storageKey, email);
  }, undefined);
};

export const readEmailForSignIn = (
  storage: KeyValueStorage = window.localStorage,
): string | null => {
  return withStorageFallback(() => {
    return storage.getItem(storageKey);
  }, null);
};

export const forgetEmailForSignIn = (
  storage: KeyValueStorage = window.localStorage,
): void => {
  withStorageFallback(() => {
    storage.removeItem(storageKey);
  }, undefined);
};

export const removeSignInLinkFromUrl = (
  location: Pick<Location, "pathname" | "hash"> = window.location,
  history: Pick<History, "replaceState"> = window.history,
): void => {
  history.replaceState(null, "", `${location.pathname}${location.hash}`);
};
