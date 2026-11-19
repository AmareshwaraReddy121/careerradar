import { Router, type Request, type Response } from 'express';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  notificationPrefsSchema,
  registerSchema,
  resetPasswordSchema,
  tokenSchema,
} from '@careerradar/shared';
import { env, isProd } from '../../config/env';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimit';
import { originCheck } from '../../middleware/originCheck';
import { validate } from '../../middleware/validate';
import { notFound } from '../../lib/errors';
import { ActionToken, RefreshToken, User, UserProfile } from '../../models';
import * as auth from './auth.service';
import { toUserDTO } from './serializers';

export const REFRESH_COOKIE = 'cr_refresh';
const COOKIE_PATH = '/api/v1/auth';

const clientInfo = (req: Request): auth.ClientInfo => ({
  ip: req.ip,
  userAgent: req.get('user-agent'),
});

function setRefreshCookie(res: Response, token: string, expires: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: COOKIE_PATH,
    expires,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: COOKIE_PATH,
  });
}

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  originCheck,
  validate(registerSchema),
  async (req, res) => {
    const { user, tokens } = await auth.register(req.body, clientInfo(req));
    setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
    res.status(201).json({ accessToken: tokens.accessToken, user: toUserDTO(user) });
  },
);

authRouter.post('/login', authLimiter, originCheck, validate(loginSchema), async (req, res) => {
  const { user, tokens } = await auth.login(req.body.email, req.body.password, clientInfo(req));
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
  res.json({ accessToken: tokens.accessToken, user: toUserDTO(user) });
});

authRouter.post('/refresh', originCheck, async (req, res) => {
  try {
    const { user, tokens } = await auth.refresh(req.cookies?.[REFRESH_COOKIE], clientInfo(req));
    setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
    res.json({ accessToken: tokens.accessToken, user: toUserDTO(user) });
  } catch (err) {
    clearRefreshCookie(res);
    throw err;
  }
});

authRouter.post('/logout', originCheck, async (req, res) => {
  await auth.logout(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.status(204).end();
});

authRouter.post('/verify-email', authLimiter, validate(tokenSchema), async (req, res) => {
  await auth.verifyEmail(req.body.token);
  res.json({ ok: true });
});

authRouter.post('/resend-verification', authLimiter, requireAuth, async (req, res) => {
  await auth.resendVerification(req.user!.id);
  res.json({ ok: true });
});

authRouter.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  async (req, res) => {
    await auth.forgotPassword(req.body.email);
    res.json({
      ok: true,
      message: 'If an account exists for this email, a reset link has been sent.',
    });
  },
);

authRouter.post('/reset-password', authLimiter, validate(resetPasswordSchema), async (req, res) => {
  await auth.resetPassword(req.body.token, req.body.password);
  clearRefreshCookie(res);
  res.json({ ok: true });
});

export const meRouter = Router();
meRouter.use(requireAuth);

meRouter.get('/', async (req, res) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw notFound();
  res.json({ user: toUserDTO(user) });
});

meRouter.post('/password', authLimiter, validate(changePasswordSchema), async (req, res) => {
  const user = await auth.changePassword(
    req.user!.id,
    req.body.currentPassword,
    req.body.newPassword,
  );
  const tokens = await auth.login(user.email, req.body.newPassword, clientInfo(req));
  setRefreshCookie(res, tokens.tokens.refreshToken, tokens.tokens.refreshExpiresAt);
  res.json({ accessToken: tokens.tokens.accessToken, user: toUserDTO(tokens.user) });
});

meRouter.put('/notification-preferences', validate(notificationPrefsSchema), async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user!.id,
    { $set: { notificationPrefs: req.body } },
    { new: true },
  );
  if (!user) throw notFound();
  res.json({ user: toUserDTO(user) });
});

/** DPDP: export everything we hold about the user. */
meRouter.get('/export', async (req, res) => {
  const [user, profile, sessions] = await Promise.all([
    User.findById(req.user!.id).lean(),
    UserProfile.findOne({ userId: req.user!.id }).lean(),
    RefreshToken.find({ userId: req.user!.id })
      .select('createdAt expiresAt revokedAt userAgent ip')
      .lean(),
  ]);
  res.setHeader('Content-Disposition', 'attachment; filename="careerradar-export.json"');
  res.json({ exportedAt: new Date().toISOString(), user, profile, sessions, appUrl: env.APP_URL });
});

/** DPDP: permanently delete the account and all personal data. */
meRouter.delete('/', authLimiter, async (req, res) => {
  const userId = req.user!.id;
  await Promise.all([
    UserProfile.deleteOne({ userId }),
    RefreshToken.deleteMany({ userId }),
    ActionToken.deleteMany({ userId }),
  ]);
  await User.deleteOne({ _id: userId });
  clearRefreshCookie(res);
  res.status(204).end();
});
