import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findAll, create } from './lib/store.js';
import { validate } from './utils/validate.js';
import { sendError } from './lib/errors.js';
import { createProjectSchema, projectFiltersSchema } from './lib/schemas.js';

const handleGet = async (request: VercelRequest, response: VercelResponse) => {
  const filters = validate(projectFiltersSchema, {
    status: request.query.status,
    priority: request.query.priority,
  });

  const projects = await findAll(filters);
  return response.status(200).json(projects);
};

const handlePost = async (request: VercelRequest, response: VercelResponse) => {
  const input = validate(createProjectSchema, request.body);
  const project = await create(input);
  return response.status(201).json(project);
};

const handler = async (request: VercelRequest, response: VercelResponse) => {
  try {
    if (request.method === 'GET') return await handleGet(request, response);
    if (request.method === 'POST') return await handlePost(request, response);

    response.setHeader('Allow', 'GET, POST');
    return response.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return sendError(response, error);
  }
};

export default handler;
