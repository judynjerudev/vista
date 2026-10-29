import { randomUUID } from "node:crypto";

import type { VercelRequest, VercelResponse } from "@vercel/node";

import { AppError } from "../errors.js";
import { withRequestId } from "../logger.js";
import { sendError } from "./responses.js";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RouteHandler = (
  request: VercelRequest,
  response: VercelResponse,
) => Promise<void>;

type RouteHandlers = Partial<Record<HttpMethod, RouteHandler>>;

const route = async (
  handlers: RouteHandlers,
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> => {
  const handle = handlers[request.method as HttpMethod];

  if (!handle) {
    response.setHeader("Allow", Object.keys(handlers).join(", "));
    sendError(
      response,
      new AppError("METHOD_NOT_ALLOWED", "Method not allowed"),
    );
    return;
  }

  try {
    await handle(request, response);
  } catch (error) {
    sendError(response, error);
  }
};

export const methodRouter = (handlers: RouteHandlers) => {
  return (request: VercelRequest, response: VercelResponse): Promise<void> => {
    // Sent back to the client and tagged on every log line, so a reported
    // failure can be matched to its logs.
    const requestId = randomUUID();
    response.setHeader("x-request-id", requestId);

    return withRequestId(requestId, () => {
      return route(handlers, request, response);
    });
  };
};
