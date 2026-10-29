import type { VercelRequest } from "@vercel/node";
import type { ZodType } from "zod";

import { validationFailed } from "../errors.js";

const parse = <T>(schema: ZodType<T>, data: unknown): T => {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw validationFailed(
      result.error.issues.map((issue) => {
        return { path: issue.path.join("."), message: issue.message };
      }),
    );
  }
  return result.data;
};

export const parseBody = <T>(request: VercelRequest, schema: ZodType<T>): T => {
  return parse(schema, request.body);
};

// Each parameter may appear once: `?status=A&status=B` is rejected rather
// than silently picking one of the values.
export const parseQuery = <T>(
  request: VercelRequest,
  schema: ZodType<T>,
): T => {
  const repeated = Object.keys(request.query).filter((name) => {
    return Array.isArray(request.query[name]);
  });

  if (repeated.length > 0) {
    throw validationFailed(
      repeated.map((name) => {
        return { path: name, message: "Must be given at most once" };
      }),
    );
  }
  return parse(schema, request.query);
};

const maxRouteParamLength = 128;

// Route parameters are used as Firestore document IDs, which can't contain
// `/` or be `.` or `..`.
export const getRouteParam = (request: VercelRequest, name: string): string => {
  const value = request.query[name];

  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maxRouteParamLength ||
    value.includes("/") ||
    value === "." ||
    value === ".."
  ) {
    throw validationFailed([{ path: name, message: "Invalid value" }]);
  }
  return value;
};
