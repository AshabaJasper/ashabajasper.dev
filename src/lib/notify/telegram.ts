import "server-only";
import { telegramEnv } from "@/lib/env";

export const TELEGRAM_MAX_CHARS = 3500;

/** Plain text. No parse_mode is ever sent, so nothing a visitor typed can become markup. */
export function telegramText(lines: string[]): string {
  const text = lines
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");
  return text.length > TELEGRAM_MAX_CHARS ? `${text.slice(0, TELEGRAM_MAX_CHARS - 3)}...` : text;
}

/**
 * Send one message through the Bot API. Outbound only: no webhook, no polling.
 * The bot token is part of the request URL, so errors are rebuilt from the
 * status code and never include the URL.
 */
export async function sendTelegram(text: string): Promise<void> {
  const env = telegramEnv();
  if (!env) throw new Error("Telegram is not configured");

  let response: Response;
  try {
    response = await fetch(`https://api.telegram.org/bot${env.token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: env.chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    throw new Error(timedOut ? "Telegram did not answer within 10 seconds" : "Could not reach Telegram");
  }
  if (!response.ok) throw new Error(`Telegram answered ${response.status}`);
}
