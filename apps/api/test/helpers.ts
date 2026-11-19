import request from 'supertest';
import { createApp } from '../src/app';
import { mailer, MemoryMailer } from '../src/lib/mailer';

export const app = createApp();
export const api = () => request(app);

export const ORIGIN = 'http://localhost:5173';

export async function registerUser(email = 'asha@example.com', password = 'Secret123') {
  const res = await api()
    .post('/api/v1/auth/register')
    .set('Origin', ORIGIN)
    .send({ fullName: 'Asha Rao', email, password, acceptTerms: true });
  if (res.status !== 201)
    throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return {
    accessToken: res.body.accessToken as string,
    user: res.body.user,
    cookie: refreshCookie(res.headers['set-cookie']),
  };
}

export function refreshCookie(setCookie: string | string[] | undefined): string {
  const list = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  const c = list.find((x) => x.startsWith('cr_refresh='));
  if (!c) throw new Error('no refresh cookie');
  return c.split(';')[0]!;
}

export function lastEmailToken(): string {
  const m = mailer as MemoryMailer;
  const last = m.sent.at(-1);
  if (!last) throw new Error('no email sent');
  const match = last.text.match(/token=([^\s&]+)/);
  if (!match) throw new Error('no token in email');
  return decodeURIComponent(match[1]!);
}
