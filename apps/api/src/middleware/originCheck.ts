import type { RequestHandler } from 'express';
import { allowedOrigins } from '../config/env';
import { forbidden } from '../lib/errors';

/** CSRF defence for cookie-authenticated endpoints: reject cross-site browser requests. */
export const originCheck: RequestHandler = (req, _res, next) => {
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) throw forbidden('Origin not allowed');
  next();
};
