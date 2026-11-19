import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';

const handler = (_req: unknown, res: { status: (n: number) => { json: (b: unknown) => void } }) =>
  res.status(429).json({
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' },
  });

const skip = () => env.NODE_ENV === 'test';

// In-memory store for Phase 1 (single API instance). Switch to a Redis store before scaling out.
export const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
  skip,
});
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
  skip,
});
