import { type ZodType, ZodError } from 'zod';
import { ApiError } from '../lib/errors.js';

export const validate = <T>(schema: ZodType<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new ApiError(400, messages.join('; '));
    }
    throw error;
  }
};
