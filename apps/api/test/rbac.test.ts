import { describe, expect, it } from 'vitest';
import { api, registerUser } from './helpers';
import { AdminLog, User } from '../src/models';
import { signAccessToken } from '../src/modules/auth/auth.service';

async function makeAdmin(email = 'admin@example.com') {
  const { user } = await registerUser(email);
  const doc = await User.findByIdAndUpdate(user.id, { role: 'admin' }, { new: true });
  return { id: user.id as string, token: signAccessToken(doc!) };
}

describe('rbac / admin', () => {
  it('forbids regular users from admin routes', async () => {
    const { accessToken } = await registerUser();
    const res = await api()
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(403);
  });

  it('forbids moderators from admin-only routes', async () => {
    const { user } = await registerUser('mod@example.com');
    const doc = await User.findByIdAndUpdate(user.id, { role: 'moderator' }, { new: true });
    const res = await api()
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${signAccessToken(doc!)}`);
    expect(res.status).toBe(403);
  });

  it('lets admins list users and change roles with an audit log', async () => {
    const admin = await makeAdmin();
    const { user } = await registerUser('asha@example.com');
    const list = await api()
      .get('/api/v1/admin/users?q=asha')
      .set('Authorization', `Bearer ${admin.token}`);
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);

    const upd = await api()
      .patch(`/api/v1/admin/users/${user.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'moderator' });
    expect(upd.status).toBe(200);
    expect(upd.body.user.role).toBe('moderator');
    expect(await AdminLog.countDocuments({ action: 'user.update' })).toBe(1);
  });

  it('prevents admins from demoting themselves', async () => {
    const admin = await makeAdmin();
    const res = await api()
      .patch(`/api/v1/admin/users/${admin.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'user' });
    expect(res.status).toBe(400);
  });
});
