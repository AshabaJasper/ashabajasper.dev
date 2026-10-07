import "server-only";
import nodemailer, { type Transporter } from "smtp-mailer";
import { smtpEnv } from "@/lib/env";

/**
 * Outgoing mail through the owner's SMTP account. Credentials come only from
 * the environment; the admin UI learns only whether SMTP is configured.
 */

let transport: Transporter | null = null;
let transportKey = "";

function getTransport(): Transporter {
  const env = smtpEnv();
  if (!env) throw new Error("SMTP is not configured");
  // Recreate the singleton when the settings change (dev server reloads).
  const key = `${env.host}:${env.port}:${env.secure}:${env.user}`;
  if (!transport || transportKey !== key) {
    transport = nodemailer.createTransport({
      host: env.host,
      port: env.port,
      secure: env.secure,
      auth: { user: env.user, pass: env.pass },
      connectionTimeout: 15_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    transportKey = key;
  }
  return transport;
}

export function isMailConfigured(): boolean {
  return smtpEnv() !== null;
}

export interface SendMailInput {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

/** Plain text only: nothing a visitor wrote is ever rendered as HTML in an email. */
export async function sendMail(input: SendMailInput): Promise<{ messageId: string }> {
  const env = smtpEnv();
  if (!env) throw new Error("SMTP is not configured");
  const info = await getTransport().sendMail({
    from: env.from,
    to: input.to,
    subject: input.subject.replace(/[\r\n]+/g, " ").slice(0, 200),
    text: input.text,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });
  return { messageId: info.messageId };
}
