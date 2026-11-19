import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';

type Part = 'body' | 'query' | 'params';

/** Validates and replaces req[part] with the parsed value. Errors go to the error handler. */
export function validate<S extends ZodTypeAny>(schema: S, part: Part = 'body'): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.parse(req[part]) as z.infer<S>;
    if (part === 'query') {
      Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
    } else {
      (req as unknown as Record<Part, unknown>)[part] = parsed;
    }
    next();
  };
}
