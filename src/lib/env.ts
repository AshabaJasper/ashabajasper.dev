/**
 * Optional environment values, read in one place. Secrets never reach the
 * client; the UI may only learn whether something is configured.
 */

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export function authSecret(): string {
  const value = read("AUTH_SECRET");
  if (!value) throw new Error("AUTH_SECRET is not set");
  return value;
}

export function setupToken(): string {
  return read("SETUP_TOKEN");
}

export function ownerEmail(): string {
  return read("ADMIN_EMAIL");
}

export interface TelegramEnv {
  token: string;
  chatId: string;
}

export function telegramEnv(): TelegramEnv | null {
  const token = read("TELEGRAM_BOT_TOKEN");
  const chatId = read("TELEGRAM_CHAT_ID");
  return token && chatId ? { token, chatId } : null;
}

export interface SmtpEnv {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  to: string;
}

export function smtpEnv(): SmtpEnv | null {
  const host = read("SMTP_HOST");
  const user = read("SMTP_USER");
  const pass = read("SMTP_PASS");
  const from = read("MAIL_FROM") || user;
  if (!host || !user || !pass || !from) return null;
  const port = Number(read("SMTP_PORT") || "465");
  return {
    host,
    port: Number.isFinite(port) ? port : 465,
    secure: read("SMTP_SECURE") !== "false",
    user,
    pass,
    from,
    to: read("MAIL_TO") || ownerEmail(),
  };
}

/** Public values: they are written into the HTML, so they are build-time variables. */
export function umamiConfig(): { scriptUrl: string; websiteId: string } | null {
  const scriptUrl = (process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "").trim();
  const websiteId = (process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "").trim();
  return scriptUrl && websiteId ? { scriptUrl, websiteId } : null;
}
