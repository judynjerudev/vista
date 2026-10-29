import type { VercelRequest, VercelResponse } from "@vercel/node";

import { authenticate } from "../../server/auth/index.js";
import { methodRouter } from "../../server/http/handler.js";
import type { RequestContext } from "../../server/http/handler.js";
import { getRouteParam, parseBody } from "../../server/http/request.js";
import { sendJson, sendNoContent } from "../../server/http/responses.js";
import { projectService } from "../../server/projects/index.js";
import { updateProjectSchema } from "../../shared/projects/contracts.js";

const getUuid = (request: VercelRequest): string => {
  return getRouteParam(request, "uuid");
};

const handleGet = async (
  request: VercelRequest,
  response: VercelResponse,
  { user }: RequestContext,
): Promise<void> => {
  const project = await projectService.get(user, getUuid(request));
  sendJson(response, 200, project);
};

const handlePut = async (
  request: VercelRequest,
  response: VercelResponse,
  { user }: RequestContext,
): Promise<void> => {
  const uuid = getUuid(request);
  const input = parseBody(request, updateProjectSchema);
  const project = await projectService.update(user, uuid, input);
  sendJson(response, 200, project);
};

const handleDelete = async (
  request: VercelRequest,
  response: VercelResponse,
  { user }: RequestContext,
): Promise<void> => {
  await projectService.remove(user, getUuid(request));
  sendNoContent(response);
};

export default methodRouter(
  { GET: handleGet, PUT: handlePut, DELETE: handleDelete },
  { authenticate },
);
