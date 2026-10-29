import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage<{ requestId: string }>();

// Everything logged while `run` executes, however deep, is tagged with the
// request ID, so one ID finds every log line for a failing request.
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
