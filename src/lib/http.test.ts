import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  http,
  setTokenProvider,
  setUnauthorizedHandler,
} from "./http";

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
    setTokenProvider(async () => {
      return null;
    });
    setUnauthorizedHandler(() => {});
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

  it("sends the signed-in user's ID token", async () => {
    respondWith(Response.json([]));
    setTokenProvider(async () => {
      return "id-token";
    });

    await http("/api/projects", { method: "POST", body: "{}" });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer id-token");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(init?.method).toBe("POST");
  });

  it("sends no Content-Type without a body", async () => {
    respondWith(Response.json([]));

    await http("/api/projects");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
  });

  it("keeps a Content-Type the caller set", async () => {
    respondWith(Response.json([]));

    await http("/api/projects", {
      method: "POST",
      body: "name=Project",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get("Content-Type")).toBe(
      "application/x-www-form-urlencoded",
    );
  });

  it("sends no Authorization header when signed out", async () => {
    respondWith(Response.json([]));

    await http("/api/projects");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });

  it("stops sending the token once the provider is unregistered", async () => {
    respondWith(Response.json([]));
    const unregister = setTokenProvider(async () => {
      return "id-token";
    });

    unregister();
    await http("/api/projects");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });

  it("keeps a newer provider when an older one is unregistered", async () => {
    respondWith(Response.json([]));
    const unregisterOlder = setTokenProvider(async () => {
      return "older-token";
    });
    setTokenProvider(async () => {
      return "newer-token";
    });

    unregisterOlder();
    await http("/api/projects");

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer newer-token",
    );
  });

  it("reports an unauthenticated response to the auth feature", async () => {
    const onUnauthorized = vi.fn();
    setUnauthorizedHandler(onUnauthorized);
    respondWith(
      Response.json(
        { error: { code: "UNAUTHENTICATED", message: "Sign in required" } },
        { status: 401 },
      ),
    );

    await expect(http("/api/projects")).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });
});
