import { ZodError } from "zod";
import type { ZodType } from "zod";

import { AppError } from "../errors.js";

export const validate = <T>(schema: ZodType<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map(
        (e) => `${e.path.join(".")}: ${e.message}`,
      );
      throw new AppError("VALIDATION_FAILED", messages.join("; "));
    }
    throw error;
  }
};
