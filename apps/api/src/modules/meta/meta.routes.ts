import { Router } from 'express';
import {
  BRANCHES,
  DEGREES,
  INDIAN_STATES,
  JOB_CATEGORIES,
  JOB_CATEGORY_LABELS,
  QUALIFICATION_LABELS,
  QUALIFICATION_LEVELS,
  RESERVATION_CATEGORIES,
  SKILLS,
} from '@careerradar/shared';

export const metaRouter = Router();

metaRouter.get('/taxonomies', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=3600');
  res.json({
    qualificationLevels: QUALIFICATION_LEVELS.map((code) => ({
      code,
      label: QUALIFICATION_LABELS[code],
    })),
    degrees: DEGREES,
    branches: BRANCHES,
    skills: SKILLS,
    states: INDIAN_STATES,
    jobCategories: JOB_CATEGORIES.map((code) => ({ code, label: JOB_CATEGORY_LABELS[code] })),
    reservationCategories: RESERVATION_CATEGORIES,
  });
});
