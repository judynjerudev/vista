import type { VercelRequest, VercelResponse } from "@vercel/node";

// A minimal stand-in for Vercel's request and response, for testing route
// handlers without a server.

export type RecordedResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
};

const createResponse = (): VercelResponse & RecordedResponse => {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader: (name: string, value: string) => {
      response.headers[name.toLowerCase()] = value;
      return response;
    },
    status: (code: number) => {
      response.statusCode = code;
      return response;
    },
    json: (body: unknown) => {
      response.body = body;
      return response;
    },
    end: () => {
      return response;
    },
  };
  return response as unknown as VercelResponse & RecordedResponse;
};

export const callHandler = async (
  handler: (request: VercelRequest, response: VercelResponse) => unknown,
  request: Partial<VercelRequest>,
): Promise<RecordedResponse> => {
  const response = createResponse();
  await handler({ query: {}, ...request } as VercelRequest, response);
  return response;
};
