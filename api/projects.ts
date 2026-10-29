import type { VercelRequest, VercelResponse } from "@vercel/node";

import { authenticate } from "../server/auth/index.js";
import { methodRouter } from "../server/http/handler.js";
import { parseBody, parseQuery } from "../server/http/request.js";
import { sendJson } from "../server/http/responses.js";
import { projectService } from "../server/projects/index.js";
import {
  createProjectSchema,
  projectFiltersSchema,
} from "../shared/projects/contracts.js";

const handleGet = async (
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> => {
  const filters = parseQuery(request, projectFiltersSchema);
  const projects = await projectService.list(filters);
  sendJson(response, 200, projects);
};

const handlePost = async (
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> => {
  const input = parseBody(request, createProjectSchema);
  const project = await projectService.create(input);
  sendJson(response, 201, project);
};

export default methodRouter(
  { GET: handleGet, POST: handlePost },
  { authenticate },
);
