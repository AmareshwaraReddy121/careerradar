import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';

export const notFoundHandler: RequestHandler = (req, res) => {
  res
    .status(404)
    .json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Some fields are invalid',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }
  if (err instanceof AppError) {
    res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Invalid ${err.path}` } });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Malformed JSON body' } });
    return;
  }
  if (err?.type === 'entity.too.large') {
    res
      .status(413)
      .json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Request body too large' } });
    return;
  }
  // Other body-parser failures (aborted uploads, bad encodings): never log the error object,
  // which can carry the partially received body.
  if (typeof err?.type === 'string' && err.status >= 400 && err.status < 500) {
    res
      .status(err.status)
      .json({ error: { code: 'BAD_REQUEST', message: 'Invalid request body' } });
    return;
  }
  logger.error(
    { err: { name: err?.name, message: err?.message, stack: err?.stack }, reqId: req.id },
    'Unhandled error',
  );
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
