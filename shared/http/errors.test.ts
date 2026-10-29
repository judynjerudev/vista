import { describe, expect, it } from "vitest";

import { isErrorResponse } from "./errors.js";

describe("isErrorResponse", () => {
  it("accepts an API error body", () => {
    expect(
      isErrorResponse({
        error: { code: "NOT_FOUND", message: "Project not found" },
      }),
    ).toBe(true);
  });

  it.each([
    null,
    "Bad gateway",
    { error: "Project not found" },
    { error: { code: "TEAPOT", message: "I'm a teapot" } },
    { error: { code: "NOT_FOUND" } },
  ])("rejects %j", (body) => {
    expect(isErrorResponse(body)).toBe(false);
  });
});
