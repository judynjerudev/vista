import type { VercelRequest, VercelResponse } from "@vercel/node";
import { projectService } from "../../server/projects/index.js";
import { validate } from "../../server/http/validate.js";
import { sendError } from "../../server/http/errors.js";
import { updateProjectSchema } from "../../shared/projects/contracts.js";

const handleGet = async (response: VercelResponse, uuid: string) => {
  const project = await projectService.get(uuid);
  return response.status(200).json(project);
};

const handlePut = async (
  request: VercelRequest,
  response: VercelResponse,
  uuid: string,
) => {
  const input = validate(updateProjectSchema, request.body);
  const project = await projectService.update(uuid, input);
  return response.status(200).json(project);
};

const handleDelete = async (response: VercelResponse, uuid: string) => {
  await projectService.remove(uuid);
  return response.status(204).end();
};

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    const uuid = request.query.uuid as string;

    if (request.method === "GET") return await handleGet(response, uuid);
    if (request.method === "PUT")
      return await handlePut(request, response, uuid);
    if (request.method === "DELETE") return await handleDelete(response, uuid);

    response.setHeader("Allow", "GET, PUT, DELETE");
    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return sendError(response, error);
  }
};

export default handler;
