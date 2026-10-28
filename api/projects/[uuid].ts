import type { VercelRequest, VercelResponse } from "@vercel/node";
import { projectRepository } from "../../server/projects/index.js";
import { validate } from "../../server/http/validate.js";
import { sendError, notFound } from "../../server/http/errors.js";
import { updateProjectSchema } from "../../shared/projects/contracts.js";

const handleGet = async (response: VercelResponse, uuid: string) => {
  const project = await projectRepository.findByUuid(uuid);
  if (!project) throw notFound("Project");
  return response.status(200).json(project);
};

const handlePut = async (
  request: VercelRequest,
  response: VercelResponse,
  uuid: string,
) => {
  const input = validate(updateProjectSchema, request.body);
  const project = await projectRepository.update(uuid, input);
  if (!project) throw notFound("Project");
  return response.status(200).json(project);
};

const handleDelete = async (response: VercelResponse, uuid: string) => {
  const deleted = await projectRepository.remove(uuid);
  if (!deleted) throw notFound("Project");
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
