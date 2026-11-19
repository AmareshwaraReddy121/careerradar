import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { allowedOrigins, env } from './config/env';
import { logger } from './lib/logger';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter, meRouter } from './modules/auth/auth.routes';
import { profileRouter } from './modules/profile/profile.routes';
import { metaRouter } from './modules/meta/meta.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { adminRouter } from './modules/admin/admin.routes';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const id = (req.headers['x-request-id'] as string) || randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
    }),
  );
  app.use(helmet());
  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  const v1 = Router();
  v1.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  v1.get('/ready', (_req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready' });
  });
  v1.use(apiLimiter);
  v1.use('/auth', authRouter);
  v1.use('/me', meRouter);
  v1.use('/profile', profileRouter);
  v1.use('/meta', metaRouter);
  v1.use('/dashboard', dashboardRouter);
  v1.use('/admin', adminRouter);

  app.use('/api/v1', v1);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
