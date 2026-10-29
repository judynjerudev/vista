import type { VercelRequest } from "@vercel/node";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AppError } from "../errors.js";
import { getRouteParam, parseBody, parseQuery } from "./request.js";

const requestWith = (parts: Partial<VercelRequest>): VercelRequest => {
  return { query: {}, ...parts } as VercelRequest;
};

const filtersSchema = z.object({ status: z.enum(["ACTIVE"]).optional() });

const expectValidationError = (run: () => unknown, message: string) => {
  expect(run).toThrow(AppError);
  expect(run).toThrow(
    expect.objectContaining({ code: "VALIDATION_FAILED", message }),
  );
};

describe("parseQuery", () => {
  it("returns the parsed parameters", () => {
    const request = requestWith({ query: { status: "ACTIVE" } });

    expect(parseQuery(request, filtersSchema)).toEqual({ status: "ACTIVE" });
  });

  it("rejects a repeated parameter", () => {
    const request = requestWith({ query: { status: ["ACTIVE", "ACTIVE"] } });

    expectValidationError(() => {
      return parseQuery(request, filtersSchema);
    }, "status: Must be given at most once");
  });

  it("rejects an invalid value", () => {
    const request = requestWith({ query: { status: "DONE" } });

    expect(() => {
      return parseQuery(request, filtersSchema);
    }).toThrow(expect.objectContaining({ code: "VALIDATION_FAILED" }));
  });
});

describe("parseBody", () => {
  it("returns the parsed body", () => {
    const request = requestWith({ body: { name: "Project" } });

    expect(parseBody(request, z.object({ name: z.string() }))).toEqual({
      name: "Project",
    });
  });

  it("rejects a missing body", () => {
    expect(() => {
      return parseBody(requestWith({}), z.object({ name: z.string() }));
    }).toThrow(expect.objectContaining({ code: "VALIDATION_FAILED" }));
  });
});

describe("getRouteParam", () => {
  it("returns a valid ID", () => {
    const request = requestWith({ query: { uuid: "abc123" } });

    expect(getRouteParam(request, "uuid")).toBe("abc123");
  });

  it.each([
    ["missing", undefined],
    ["empty", ""],
    ["repeated", ["a", "b"]],
    ["too long", "a".repeat(129)],
    ["a path", "a/b"],
    ["a relative segment", ".."],
  ])("rejects a %s ID", (_, uuid) => {
    const request = requestWith({ query: uuid === undefined ? {} : { uuid } });

    expectValidationError(() => {
      return getRouteParam(request, "uuid");
    }, "uuid: Invalid value");
  });
});
