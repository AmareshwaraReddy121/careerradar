import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ROLE_RANK, type Role } from '@careerradar/shared';
import { env } from '../config/env';
import { User } from '../models';
import { forbidden, unauthorized } from '../lib/errors';

export interface AuthUser {
  id: string;
  role: Role;
  email: string;
  emailVerified: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface AccessPayload {
  sub: string;
  role: Role;
  iat: number;
}

async function resolveUser(header: string | undefined): Promise<AuthUser | null> {
  if (!header?.startsWith('Bearer ')) return null;
  let payload: AccessPayload;
  try {
    payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: 'careerradar',
    }) as AccessPayload;
  } catch {
    throw unauthorized('Invalid or expired access token');
  }
  // Re-read the user so role changes, suspensions and password resets take effect immediately.
  const user = await User.findById(payload.sub)
    .select('email role status emailVerifiedAt passwordChangedAt')
    .lean();
  if (!user || user.status !== 'active') throw unauthorized('Account is not active');
  if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime() - 1000) {
    throw unauthorized('Session expired, please sign in again');
  }
  return {
    id: String(user._id),
    role: user.role,
    email: user.email,
    emailVerified: !!user.emailVerifiedAt,
  };
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const user = await resolveUser(req.headers.authorization);
  if (!user) throw unauthorized();
  req.user = user;
  next();
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    req.user = (await resolveUser(req.headers.authorization)) ?? undefined;
  } catch {
    req.user = undefined;
  }
  next();
};

/** Requires the authenticated user's role to be at least `min` (user < moderator < admin). */
export function requireRole(min: Role): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw unauthorized();
    if (ROLE_RANK[req.user.role] < ROLE_RANK[min]) throw forbidden();
    next();
  };
}
