import { describe, expect, it } from 'vitest';
import { api, lastEmailToken, ORIGIN, refreshCookie, registerUser } from './helpers';
import { User } from '../src/models';

describe('auth', () => {
  it('registers, returns access token, refresh cookie and sends verification email', async () => {
    const { accessToken, user, cookie } = await registerUser();
    expect(accessToken).toBeTruthy();
    expect(cookie).toMatch(/^cr_refresh=/);
    expect(user).toMatchObject({ email: 'asha@example.com', role: 'user', emailVerified: false });
    expect(user).not.toHaveProperty('passwordHash');

    const me = await api().get('/api/v1/me').set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('asha@example.com');
  });

  it('rejects duplicate email and weak passwords', async () => {
    await registerUser();
    const dup = await api().post('/api/v1/auth/register').send({
      fullName: 'X Y',
      email: 'ASHA@example.com',
      password: 'Secret123',
      acceptTerms: true,
    });
    expect(dup.status).toBe(409);
    const weak = await api()
      .post('/api/v1/auth/register')
      .send({ fullName: 'X Y', email: 'b@example.com', password: 'short', acceptTerms: true });
    expect(weak.status).toBe(400);
    expect(weak.body.error.code).toBe('VALIDATION_ERROR');
    const noTerms = await api()
      .post('/api/v1/auth/register')
      .send({ fullName: 'X Y', email: 'c@example.com', password: 'Secret123' });
    expect(noTerms.status).toBe(400);
  });

  it('logs in with correct credentials only', async () => {
    await registerUser();
    const bad = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'asha@example.com', password: 'Wrong1234' });
    expect(bad.status).toBe(401);
    const unknown = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'Wrong1234' });
    expect(unknown.status).toBe(401);
    expect(unknown.body.error.message).toBe(bad.body.error.message);
    const ok = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'asha@example.com', password: 'Secret123' });
    expect(ok.status).toBe(200);
    expect(ok.body.accessToken).toBeTruthy();
  });

  it('verifies email with a single-use token', async () => {
    const { accessToken } = await registerUser();
    const token = lastEmailToken();
    const res = await api().post('/api/v1/auth/verify-email').send({ token });
    expect(res.status).toBe(200);
    const again = await api().post('/api/v1/auth/verify-email').send({ token });
    expect(again.status).toBe(400);
    const me = await api().get('/api/v1/me').set('Authorization', `Bearer ${accessToken}`);
    expect(me.body.user.emailVerified).toBe(true);
  });

  it('rotates refresh tokens and revokes the family on reuse', async () => {
    const { cookie } = await registerUser();
    const r1 = await api().post('/api/v1/auth/refresh').set('Cookie', cookie).set('Origin', ORIGIN);
    expect(r1.status).toBe(200);
    const cookie2 = refreshCookie(r1.headers['set-cookie']);
    expect(cookie2).not.toBe(cookie);

    const reuse = await api().post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(reuse.status).toBe(401);
    // The newer token from the same family is revoked too.
    const r2 = await api().post('/api/v1/auth/refresh').set('Cookie', cookie2);
    expect(r2.status).toBe(401);
  });

  it('blocks cookie endpoints from foreign origins', async () => {
    const { cookie } = await registerUser();
    const res = await api()
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookie)
      .set('Origin', 'https://evil.example');
    expect(res.status).toBe(403);
  });

  it('logout revokes the refresh token', async () => {
    const { cookie } = await registerUser();
    expect((await api().post('/api/v1/auth/logout').set('Cookie', cookie)).status).toBe(204);
    expect((await api().post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(401);
  });

  it('resets password, invalidates old sessions and old password', async () => {
    const { cookie } = await registerUser();
    const fp = await api().post('/api/v1/auth/forgot-password').send({ email: 'asha@example.com' });
    expect(fp.status).toBe(200);
    const unknown = await api()
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'nobody@example.com' });
    expect(unknown.body).toEqual(fp.body);

    const token = lastEmailToken();
    const rp = await api()
      .post('/api/v1/auth/reset-password')
      .send({ token, password: 'NewSecret456' });
    expect(rp.status).toBe(200);
    expect((await api().post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(401);
    expect(
      (
        await api()
          .post('/api/v1/auth/login')
          .send({ email: 'asha@example.com', password: 'Secret123' })
      ).status,
    ).toBe(401);
    expect(
      (
        await api()
          .post('/api/v1/auth/login')
          .send({ email: 'asha@example.com', password: 'NewSecret456' })
      ).status,
    ).toBe(200);
  });

  it('rejects access tokens of suspended users immediately', async () => {
    const { accessToken, user } = await registerUser();
    await User.updateOne({ _id: user.id }, { status: 'suspended' });
    const me = await api().get('/api/v1/me').set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(401);
  });

  it('deletes the account and its data', async () => {
    const { accessToken } = await registerUser();
    const del = await api().delete('/api/v1/me').set('Authorization', `Bearer ${accessToken}`);
    expect(del.status).toBe(204);
    expect(await User.countDocuments()).toBe(0);
  });
});
