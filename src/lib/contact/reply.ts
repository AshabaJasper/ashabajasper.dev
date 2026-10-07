import { formatDate } from "@/lib/utils";

/**
 * Pure helpers for answering a contact message, shared by the SMTP reply and
 * the "Open in email app" link. Safe in client components.
 */

export interface QuotedMessage {
  name: string;
  email: string;
  subject: string | null;
  body: string;
  createdAt: Date | string;
}

/** "Re: <subject>", without stacking "Re: Re:". */
export function replySubject(subject: string | null): string {
  const clean = (subject ?? "").replace(/[\r\n]+/g, " ").trim();
  if (!clean) return "Re: your message";
  return /^re:/i.test(clean) ? clean : `Re: ${clean}`;
}

/** The original message, quoted the way mail clients do. */
export function quoteForReply(message: Pick<QuotedMessage, "name" | "body" | "createdAt">, maxChars = 6000): string {
  const body = message.body.length > maxChars ? `${message.body.slice(0, maxChars)}\n[...]` : message.body;
  const quoted = body
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
  return `On ${formatDate(message.createdAt)}, ${message.name} wrote:\n${quoted}`;
}

/** Many mail apps refuse very long mailto links, so the quote is cut short. */
const MAILTO_QUOTE_CHARS = 1500;

/** A mailto link prefilled with the subject and the quoted message. */
export function mailtoHref(message: QuotedMessage): string {
  const params = new URLSearchParams({
    subject: replySubject(message.subject),
    body: `\n\n${quoteForReply(message, MAILTO_QUOTE_CHARS)}`,
  });
  // mailto expects %20 for spaces, not "+".
  return `mailto:${encodeURIComponent(message.email).replace(/%40/g, "@")}?${params.toString().replace(/\+/g, "%20")}`;
}

/** The first words of a message, for the inbox list when there is no subject. */
export function excerpt(text: string, maxChars = 80): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= maxChars) return flat;
  const cut = flat.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}...`;
}
