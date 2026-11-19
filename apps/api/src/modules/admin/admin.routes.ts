import { Router } from 'express';
import { z } from 'zod';
import { ROLES, USER_STATUSES } from '@careerradar/shared';
import { requireAuth, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { badRequest, notFound } from '../../lib/errors';
import { AdminLog, User } from '../../models';
import { revokeAllSessions } from '../auth/auth.service';
import { toUserDTO } from '../auth/serializers';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('moderator'));

const listUsersQuery = z.object({
  q: z.string().trim().max(100).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(USER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

adminRouter.get(
  '/users',
  requireRole('admin'),
  validate(listUsersQuery, 'query'),
  async (req, res) => {
    const { q, role, status, page, limit } = req.query as unknown as z.infer<typeof listUsersQuery>;
    const filter: Record<string, unknown> = {};
    if (q) filter.email = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (role) filter.role = role;
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ data: items.map(toUserDTO), page, limit, total });
  },
);

const updateUserBody = z
  .object({ role: z.enum(ROLES).optional(), status: z.enum(USER_STATUSES).optional() })
  .refine((b) => b.role || b.status, 'Provide role or status');

adminRouter.patch(
  '/users/:id',
  requireRole('admin'),
  validate(updateUserBody),
  async (req, res) => {
    const id = String(req.params.id);
    if (id === req.user!.id) throw badRequest('You cannot change your own role or status');
    const user = await User.findById(id);
    if (!user) throw notFound('User not found');

    const before = { role: user.role, status: user.status };
    if (req.body.role) user.role = req.body.role;
    if (req.body.status) user.status = req.body.status;
    await user.save();
    if (user.status !== 'active') await revokeAllSessions(user._id);

    await AdminLog.create({
      actorId: req.user!.id,
      action: 'user.update',
      entity: { kind: 'user', id: String(user._id) },
      before,
      after: { role: user.role, status: user.status },
      ip: req.ip,
      userAgent: req.get('user-agent') ?? null,
    });
    res.json({ user: toUserDTO(user) });
  },
);

adminRouter.get('/audit-logs', requireRole('admin'), async (_req, res) => {
  const logs = await AdminLog.find().sort({ createdAt: -1 }).limit(100).lean();
  res.json({ data: logs });
});
