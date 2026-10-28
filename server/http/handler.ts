import type { VercelRequest, VercelResponse } from "@vercel/node";

import { sendError } from "./errors.js";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RouteHandler = (
  request: VercelRequest,
  response: VercelResponse,
) => Promise<unknown>;

export const methodRouter = (
  handlers: Partial<Record<HttpMethod, RouteHandler>>,
) => {
  return async (
    request: VercelRequest,
    response: VercelResponse,
  ): Promise<void> => {
    const handle = handlers[request.method as HttpMethod];

    if (!handle) {
      response.setHeader("Allow", Object.keys(handlers).join(", "));
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      await handle(request, response);
    } catch (error) {
      sendError(response, error);
    }
  };
};
