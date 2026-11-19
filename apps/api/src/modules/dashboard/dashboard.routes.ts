import { Router } from 'express';
import type { DashboardSummary } from '@careerradar/shared';
import { optionalAuth } from '../../middleware/auth';
import { UserProfile } from '../../models';
import { profileCompleteness } from '../profile/profile.service';

export const dashboardRouter = Router();

/**
 * Phase 1: job, news, tech and tracker collections do not exist yet, so their counts are
 * reported as zero and listed in `pendingModules`. Each later phase replaces its section
 * with real aggregates.
 */
dashboardRouter.get('/summary', optionalAuth, async (req, res) => {
  let completeness: number | null = null;
  if (req.user) {
    const p = await UserProfile.findOne({ userId: req.user.id }).lean();
    completeness = p ? profileCompleteness(p as never) : null;
  }
  const summary: DashboardSummary = {
    lastUpdatedAt: null,
    jobs: {
      active: 0,
      newThisWeek: 0,
      matchingProfile: req.user ? 0 : null,
      closingSoon: 0,
      government: 0,
      private: 0,
    },
    applications: req.user ? { total: 0, byStatus: {} } : null,
    latestTechUpdates: [],
    latestNews: [],
    profileCompleteness: completeness,
    pendingModules: ['jobs', 'eligibility', 'technology', 'news', 'applications'],
  };
  res.json(summary);
});
