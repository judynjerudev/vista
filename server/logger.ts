import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage<{ requestId: string }>();

export const withRequestId = <T>(requestId: string, run: () => T): T => {
  return requestContext.run({ requestId }, run);
};

export const logError = (message: string, ...details: unknown[]): void => {
  const requestId = requestContext.getStore()?.requestId;
  console.error(
    requestId ? `[request ${requestId}] ${message}` : message,
    ...details,
  );
};
