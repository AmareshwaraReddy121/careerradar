import argon2 from 'argon2';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import type { RegisterInput } from '@careerradar/shared';
import { env } from '../../config/env';
import { randomToken, sha256 } from '../../lib/crypto';
import { sendMailSafe } from '../../lib/mailer';
import { badRequest, conflict, unauthorized } from '../../lib/errors';
import { logger } from '../../lib/logger';
import {
  ActionToken,
  RefreshToken,
  User,
  UserProfile,
  type ActionTokenType,
  type UserDoc,
} from '../../models';
import { resetPasswordEmail, verificationEmail } from './emails';

const ARGON_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;
const TERMS_VERSION = '2026-11';
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

// Used to keep login timing similar whether or not the email exists.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= argon2.hash('dummy-password-for-timing', ARGON_OPTS));

export const hashPassword = (password: string) => argon2.hash(password, ARGON_OPTS);

export interface ClientInfo {
  ip?: string;
  userAgent?: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export function signAccessToken(user: Pick<UserDoc, '_id' | 'role'>): string {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: String(user._id),
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
    algorithm: 'HS256',
    issuer: 'careerradar',
  });
}

async function issueRefreshToken(userId: unknown, familyId: string, client: ClientInfo) {
  const raw = randomToken(32); // only the SHA-256 hash is stored
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  await RefreshToken.create({
    userId,
    tokenHash: sha256(raw),
    familyId,
    expiresAt,
    userAgent: client.userAgent?.slice(0, 300) ?? null,
    ip: client.ip ?? null,
  });
  return { raw, expiresAt };
}

async function issueTokens(
  user: UserDoc,
  client: ClientInfo,
  familyId = randomUUID(),
): Promise<IssuedTokens> {
  const { raw, expiresAt } = await issueRefreshToken(user._id, familyId, client);
  return { accessToken: signAccessToken(user), refreshToken: raw, refreshExpiresAt: expiresAt };
}

async function createActionToken(
  userId: unknown,
  type: ActionTokenType,
  ttlMs: number,
): Promise<string> {
  await ActionToken.updateMany({ userId, type, usedAt: null }, { $set: { usedAt: new Date() } });
  const raw = randomToken(32);
  await ActionToken.create({
    userId,
    type,
    tokenHash: sha256(raw),
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return raw;
}

async function consumeActionToken(raw: string, type: ActionTokenType) {
  const token = await ActionToken.findOneAndUpdate(
    { tokenHash: sha256(raw), type, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  );
  if (!token) throw badRequest('This link is invalid or has expired');
  return token;
}

export async function register(input: RegisterInput, client: ClientInfo) {
  const exists = await User.exists({ email: input.email });
  if (exists) throw conflict('An account with this email already exists');

  const user = await User.create({
    email: input.email,
    passwordHash: await hashPassword(input.password),
    consents: [{ type: 'terms_privacy', version: TERMS_VERSION, grantedAt: new Date() }],
  });
  try {
    await UserProfile.create({ userId: user._id, fullName: input.fullName });
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }

  const token = await createActionToken(user._id, 'verify_email', VERIFY_TTL_MS);
  await sendMailSafe(verificationEmail(user.email, token));
  logger.info({ userId: String(user._id) }, 'User registered');
  return { user, tokens: await issueTokens(user, client) };
}

export async function login(email: string, password: string, client: ClientInfo) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    await argon2.verify(await getDummyHash(), password).catch(() => false);
    throw unauthorized('Incorrect email or password');
  }
  const ok = await argon2.verify(user.passwordHash, password);
  if (!ok) throw unauthorized('Incorrect email or password');
  if (user.status !== 'active') throw unauthorized('This account is not active. Contact support.');

  user.lastLoginAt = new Date();
  await user.save();
  return { user, tokens: await issueTokens(user, client) };
}

/** Rotates the refresh token. Reuse of an already-rotated token revokes the whole family. */
export async function refresh(raw: string | undefined, client: ClientInfo) {
  if (!raw) throw unauthorized('No session');
  const record = await RefreshToken.findOne({ tokenHash: sha256(raw) });
  if (!record || record.expiresAt <= new Date()) throw unauthorized('Session expired');

  if (record.revokedAt) {
    await RefreshToken.updateMany(
      { familyId: record.familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    logger.warn(
      { userId: String(record.userId), familyId: record.familyId },
      'Refresh token reuse detected',
    );
    throw unauthorized('Session expired');
  }

  const user = await User.findById(record.userId);
  if (!user || user.status !== 'active') throw unauthorized('Account is not active');

  const next = await issueRefreshToken(user._id, record.familyId, client);
  const claimed = await RefreshToken.updateOne(
    { _id: record._id, revokedAt: null },
    { $set: { revokedAt: new Date(), replacedByHash: sha256(next.raw) } },
  );
  if (claimed.modifiedCount === 0) {
    // Lost a race with a concurrent refresh using the same token.
    await RefreshToken.deleteOne({ tokenHash: sha256(next.raw) });
    throw unauthorized('Session expired');
  }
  return {
    user,
    tokens: {
      accessToken: signAccessToken(user),
      refreshToken: next.raw,
      refreshExpiresAt: next.expiresAt,
    },
  };
}

export async function logout(raw: string | undefined) {
  if (!raw) return;
  await RefreshToken.updateOne(
    { tokenHash: sha256(raw), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function revokeAllSessions(userId: unknown) {
  await RefreshToken.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function verifyEmail(raw: string) {
  const token = await consumeActionToken(raw, 'verify_email');
  await User.updateOne(
    { _id: token.userId, emailVerifiedAt: null },
    { $set: { emailVerifiedAt: new Date() } },
  );
}

export async function resendVerification(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw unauthorized();
  if (user.emailVerifiedAt) throw badRequest('Email is already verified');
  const token = await createActionToken(user._id, 'verify_email', VERIFY_TTL_MS);
  await sendMailSafe(verificationEmail(user.email, token));
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email, status: 'active' });
  if (!user) return; // Don't reveal whether the email is registered.
  const token = await createActionToken(user._id, 'reset_password', RESET_TTL_MS);
  await sendMailSafe(resetPasswordEmail(user.email, token));
}

export async function resetPassword(raw: string, password: string) {
  const token = await consumeActionToken(raw, 'reset_password');
  await User.updateOne(
    { _id: token.userId },
    { $set: { passwordHash: await hashPassword(password), passwordChangedAt: new Date() } },
  );
  await revokeAllSessions(token.userId);
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw unauthorized();
  if (!(await argon2.verify(user.passwordHash, currentPassword))) {
    throw badRequest('Current password is incorrect');
  }
  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  await user.save();
  await revokeAllSessions(user._id);
  return user;
}
