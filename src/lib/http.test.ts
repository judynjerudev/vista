import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, http } from "./http";

const respondWith = (response: Response) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      return response;
    }),
  );
};

const requestError = async (): Promise<ApiError> => {
  try {
    await http("/api/projects");
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("Expected the request to fail");
};

describe("http", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the parsed JSON body", async () => {
    respondWith(Response.json([{ uuid: "project-1" }]));

    expect(await http("/api/projects")).toEqual([{ uuid: "project-1" }]);
  });

  it("reads the code, details and request ID of an API error", async () => {
    respondWith(
      Response.json(
        {
          error: {
            code: "VALIDATION_FAILED",
            message: "name: Required",
            details: [{ path: "name", message: "Required" }],
          },
        },
        { status: 400, headers: { "x-request-id": "request-1" } },
      ),
    );

    const error = await requestError();

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "VALIDATION_FAILED",
      message: "name: Required",
      details: [{ path: "name", message: "Required" }],
      requestId: "request-1",
    });
  });

  it("treats a response that isn't an API error as internal", async () => {
    respondWith(
      new Response("<html>Bad gateway</html>", {
        status: 502,
        statusText: "Bad Gateway",
      }),
    );

    expect(await requestError()).toMatchObject({
      status: 502,
      code: "INTERNAL",
      message: "Bad Gateway",
      details: [],
      requestId: null,
    });
  });
});
