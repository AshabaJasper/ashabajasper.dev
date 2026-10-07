import "server-only";
import { smtpEnv, telegramEnv } from "@/lib/env";
import { siteUrl } from "@/lib/sites";
import { sendMail } from "@/lib/mail/send";
import { sendTelegram, telegramText } from "./telegram";

export interface OwnerNotice {
  kind: "contact" | "comment";
  name: string;
  postSlug?: string;
}

/** One line, no control characters, at most 80 characters: a visitor's name is untrusted text. */
function cleanName(name: string): string {
  const flat = name.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
  return (flat || "someone").slice(0, 80);
}

export function noticeHeadline(notice: OwnerNotice): string {
  const name = cleanName(notice.name);
  return notice.kind === "contact"
    ? `New contact message from ${name}`
    : `New comment on ${notice.postSlug ?? "a post"} from ${name}`;
}

export function noticeAdminUrl(notice: OwnerNotice): string {
  return siteUrl("admin", notice.kind === "contact" ? "/inbox" : "/comments");
}

/**
 * Tell the owner something arrived. Telegram gets a generic line and the
 * admin link, never the message itself. Email goes to MAIL_TO (or ADMIN_EMAIL)
 * with the same details. Both are best effort: failures are logged without
 * any content and never thrown, because the visitor's submission is already
 * stored and must not fail because of a notification.
 */
export async function notifyOwner(notice: OwnerNotice): Promise<void> {
  const headline = noticeHeadline(notice);
  const url = noticeAdminUrl(notice);
  const tasks: Promise<void>[] = [];

  if (telegramEnv()) {
    tasks.push(
      sendTelegram(telegramText([headline, url])).catch((err: unknown) => {
        console.error("[notify] telegram failed:", err instanceof Error ? err.name : "unknown error");
      }),
    );
  }

  const smtp = smtpEnv();
  if (smtp && smtp.to) {
    const where =
      notice.kind === "contact"
        ? "Sent through the contact form on the portfolio."
        : `Post: ${siteUrl("blog", `/${notice.postSlug ?? ""}`)}\nIt is waiting for your approval.`;
    const text = `${headline}\n\n${where}\n\nOpen it in the admin: ${url}\n`;
    tasks.push(
      sendMail({ to: smtp.to, subject: headline, text })
        .then(() => undefined)
        .catch((err: unknown) => {
          console.error("[notify] email failed:", err instanceof Error ? err.name : "unknown error");
        }),
    );
  }

  await Promise.all(tasks);
}
