import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

class SmtpMailer implements Mailer {
  constructor(private transport: Transporter) {}
  async send(message: MailMessage) {
    await this.transport.sendMail({ from: env.MAIL_FROM, ...message });
  }
}

/** Used when SMTP is not configured (and in tests): logs instead of sending. */
export class MemoryMailer implements Mailer {
  sent: MailMessage[] = [];
  async send(message: MailMessage) {
    this.sent.push(message);
    logger.info({ to: message.to, subject: message.subject }, 'Email (not sent: SMTP_URL not set)');
  }
}

export let mailer: Mailer = env.SMTP_URL
  ? new SmtpMailer(nodemailer.createTransport(env.SMTP_URL))
  : new MemoryMailer();

export function setMailer(m: Mailer) {
  mailer = m;
}

/** Email failures must never break the user-facing request. */
export async function sendMailSafe(message: MailMessage): Promise<void> {
  try {
    await mailer.send(message);
  } catch (err) {
    logger.error({ err, to: message.to, subject: message.subject }, 'Failed to send email');
  }
}
