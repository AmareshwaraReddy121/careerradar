import { env } from '../../config/env';
import type { MailMessage } from '../../lib/mailer';

const layout = (title: string, body: string, cta: { label: string; url: string }) => `
<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#0f172a">
  <h2 style="margin:0 0 16px">${title}</h2>
  <p style="line-height:1.5">${body}</p>
  <p><a href="${cta.url}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${cta.label}</a></p>
  <p style="font-size:12px;color:#64748b">If the button doesn't work, open this link: ${cta.url}</p>
  <p style="font-size:12px;color:#64748b">— CareerRadar</p>
</div>`;

export function verificationEmail(to: string, token: string): MailMessage {
  const url = `${env.APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: 'Verify your CareerRadar email',
    text: `Welcome to CareerRadar! Verify your email address: ${url}\nThis link expires in 24 hours.`,
    html: layout(
      'Verify your email',
      'Welcome to CareerRadar! Confirm your email address to receive job alerts. This link expires in 24 hours.',
      { label: 'Verify email', url },
    ),
  };
}

export function resetPasswordEmail(to: string, token: string): MailMessage {
  const url = `${env.APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: 'Reset your CareerRadar password',
    text: `Reset your password: ${url}\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    html: layout(
      'Reset your password',
      "We received a request to reset your password. This link expires in 1 hour. If you didn't request it, you can ignore this email.",
      { label: 'Reset password', url },
    ),
  };
}
