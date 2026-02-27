import type { VercelResponse } from '@vercel/node';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export function notFound(resource: string): ApiError {
  return new ApiError(404, `${resource} not found`);
}

export function sendError(res: VercelResponse, error: unknown): void {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
}
