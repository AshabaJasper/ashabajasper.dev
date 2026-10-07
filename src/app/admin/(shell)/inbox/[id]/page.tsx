import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { smtpEnv } from "@/lib/env";
import { mailtoHref, quoteForReply, replySubject } from "@/lib/contact/reply";
import { formatDateTime } from "@/lib/contact/format";
import { deviceLabel } from "@/lib/auth/pin";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { MarkReadOnOpen, MessageStatusActions } from "@/components/admin/inbox/message-actions";
import { ReplyPanel } from "@/components/admin/inbox/reply-panel";
import { requireOwnerId } from "../../require-owner";

export const metadata: Metadata = {
  title: "Message",
  description: "One contact message, its sender and the reply to it.",
};

export const dynamic = "force-dynamic";

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireOwnerId();
  const { id } = await params;
  if (id.length > 64) notFound();
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) notFound();

  const [sameSender, sameEmail] = await Promise.all([
    message.ipHash
      ? prisma.contactMessage.count({ where: { ipHash: message.ipHash, NOT: { id: message.id } } })
      : Promise.resolve(null),
    prisma.contactMessage.count({ where: { email: message.email, NOT: { id: message.id } } }),
  ]);

  const smtpConfigured = smtpEnv() !== null;
  const title = message.subject || `Message from ${message.name}`;

  return (
    <>
      <MarkReadOnOpen id={message.id} isNew={message.status === "NEW"} />
      <PageHeader
        back={{ href: "/inbox", label: "Inbox" }}
        kicker={`From ${message.name}`}
        title={title}
        actions={<MessageStatusActions id={message.id} status={message.status} />}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-x-12">
        <article aria-label="Message" className="border-rule bg-card min-w-0 rounded-xl border p-5 sm:p-7 lg:col-start-1">
          <div className="text-muted-foreground mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
            <StatusBadge status={message.status === "NEW" ? "READ" : message.status} />
            <time dateTime={message.createdAt.toISOString()} className="font-mono text-xs tabular-nums">
              {formatDateTime(message.createdAt)}
            </time>
          </div>
          {/* Plain text: a visitor's message is never rendered as HTML or Markdown. */}
          <div className="text-[1.02rem] leading-[1.7] break-words whitespace-pre-wrap">{message.body}</div>
        </article>

        <aside aria-label="Sender" className="space-y-6 text-sm lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-1">
          <dl className="space-y-4">
            <div>
              <dt className="kicker">Name</dt>
              <dd className="mt-1 break-words">{message.name}</dd>
            </div>
            <div>
              <dt className="kicker">Email</dt>
              <dd className="mt-1 break-all">
                <a href={`mailto:${message.email}`} className="link">
                  {message.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="kicker">Earlier messages</dt>
              <dd className="text-ink-soft mt-1 space-y-1">
                <p>
                  {sameEmail === 0
                    ? "None from this email address."
                    : `${sameEmail} other ${sameEmail === 1 ? "message" : "messages"} from this email address.`}
                </p>
                <p>
                  {sameSender === null
                    ? "Sender network unknown or cleared after 30 days."
                    : sameSender === 0
                      ? "No others from the same sender network."
                      : `Same sender as ${sameSender} other ${sameSender === 1 ? "message" : "messages"}.`}
                </p>
              </dd>
            </div>
            <div>
              <dt className="kicker">Browser</dt>
              <dd className="text-ink-soft mt-1">{deviceLabel(message.userAgent)}</dd>
            </div>
          </dl>
        </aside>

        <div className="min-w-0 lg:col-start-1">
          <ReplyPanel
            id={message.id}
            email={message.email}
            smtpConfigured={smtpConfigured}
            mailto={mailtoHref(message)}
            subject={replySubject(message.subject)}
            quote={quoteForReply(message)}
            replied={
              message.repliedAt
                ? {
                    at: formatDateTime(message.repliedAt),
                    via: message.replyVia === "smtp" ? "smtp" : "mailto",
                    body: message.replyBody,
                  }
                : null
            }
          />
        </div>
      </div>
    </>
  );
}
