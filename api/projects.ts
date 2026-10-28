import type { VercelRequest, VercelResponse } from "@vercel/node";

import { methodRouter } from "../server/http/handler.js";
import { validate } from "../server/http/validate.js";
import { projectService } from "../server/projects/index.js";
import {
  createProjectSchema,
  projectFiltersSchema,
} from "../shared/projects/contracts.js";

const handleGet = async (request: VercelRequest, response: VercelResponse) => {
  const filters = validate(projectFiltersSchema, {
    status: request.query.status,
    priority: request.query.priority,
  });

  const projects = await projectService.list(filters);
  return response.status(200).json(projects);
};

const handlePost = async (request: VercelRequest, response: VercelResponse) => {
  const input = validate(createProjectSchema, request.body);
  const project = await projectService.create(input);
  return response.status(201).json(project);
};

export default methodRouter({ GET: handleGet, POST: handlePost });
