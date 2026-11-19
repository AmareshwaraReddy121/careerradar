import { describe, expect, it } from 'vitest';
import { api, registerUser } from './helpers';

describe('misc', () => {
  it('health and taxonomies', async () => {
    expect((await api().get('/api/v1/health')).body).toEqual({ status: 'ok' });
    const tax = await api().get('/api/v1/meta/taxonomies');
    expect(tax.status).toBe(200);
    expect(tax.body.degrees.length).toBeGreaterThan(10);
    expect(tax.body.branches.find((b: { code: string }) => b.code === 'CSE')).toBeTruthy();
  });

  it('dashboard summary works for guests and users', async () => {
    const guest = await api().get('/api/v1/dashboard/summary');
    expect(guest.status).toBe(200);
    expect(guest.body.jobs.matchingProfile).toBeNull();
    const { accessToken } = await registerUser();
    const user = await api()
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(user.body.profileCompleteness).toBe(11);
  });

  it('returns JSON 404 and handles malformed JSON', async () => {
    expect((await api().get('/api/v1/nope')).status).toBe(404);
    const bad = await api()
      .post('/api/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad');
    expect(bad.status).toBe(400);
  });
});
