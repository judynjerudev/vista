import type { VercelRequest, VercelResponse } from "@vercel/node";

import { methodRouter } from "../../server/http/handler.js";
import { validate } from "../../server/http/validate.js";
import { projectService } from "../../server/projects/index.js";
import { updateProjectSchema } from "../../shared/projects/contracts.js";

const getUuid = (request: VercelRequest): string => {
  return request.query.uuid as string;
};

const handleGet = async (request: VercelRequest, response: VercelResponse) => {
  const project = await projectService.get(getUuid(request));
  return response.status(200).json(project);
};

const handlePut = async (request: VercelRequest, response: VercelResponse) => {
  const input = validate(updateProjectSchema, request.body);
  const project = await projectService.update(getUuid(request), input);
  return response.status(200).json(project);
};

const handleDelete = async (
  request: VercelRequest,
  response: VercelResponse,
) => {
  await projectService.remove(getUuid(request));
  return response.status(204).end();
};

export default methodRouter({
  GET: handleGet,
  PUT: handlePut,
  DELETE: handleDelete,
});
