import { Router } from 'express';
import { profileSchema, sensitiveConsentSchema } from '@careerradar/shared';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as profile from './profile.service';

export const profileRouter = Router();
profileRouter.use(requireAuth);

profileRouter.get('/', async (req, res) => {
  res.json({ profile: await profile.getProfile(req.user!.id) });
});

profileRouter.put('/', validate(profileSchema), async (req, res) => {
  res.json({ profile: await profile.updateProfile(req.user!.id, req.body) });
});

profileRouter.get('/sensitive', async (req, res) => {
  res.json({ sensitive: await profile.getSensitive(req.user!.id) });
});

profileRouter.put('/sensitive', validate(sensitiveConsentSchema), async (req, res) => {
  const { consent: _consent, ...data } = req.body;
  res.json({ sensitive: await profile.updateSensitive(req.user!.id, data) });
});

/** Withdraw consent: erase sensitive fields. */
profileRouter.delete('/sensitive', async (req, res) => {
  await profile.deleteSensitive(req.user!.id);
  res.status(204).end();
});
