import type { Metadata } from "next";
import Link from "next/link";
import type { MessageStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { INBOX_FILTERS, type InboxFilter } from "@/lib/validators/inbox";
import { excerpt } from "@/lib/contact/reply";
import { formatDateTime, formatListDate } from "@/lib/contact/format";
import { EmptyState, FilterTabs, PageHeader, Pagination } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { cn } from "@/lib/utils";
import { requireOwnerId } from "../require-owner";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Messages sent through the contact form on the portfolio.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const LABELS: Record<InboxFilter, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  archived: "Archived",
  spam: "Spam",
  all: "All",
};

const EMPTY: Record<InboxFilter, { title: string; body: string }> = {
  new: { title: "Nothing new", body: "New messages from the contact form land here first." },
  read: { title: "No read messages", body: "Messages you have opened but not answered show up here." },
  replied: { title: "No replies yet", body: "Messages you have answered, by email or from your mail app, collect here." },
  archived: { title: "Nothing archived", body: "Archive a message to keep it without it sitting in the way." },
  spam: { title: "No spam", body: "Messages you mark as spam are kept here, out of the inbox." },
  all: { title: "No messages yet", body: "When someone writes through the contact form, it appears here." },
};

function parseFilter(value: string | undefined): InboxFilter {
  return INBOX_FILTERS.includes(value as InboxFilter) ? (value as InboxFilter) : "new";
}

function parsePage(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && n < 100_000 ? n : 1;
}

function hrefFor(filter: InboxFilter, page = 1): string {
  const params = new URLSearchParams();
  if (filter !== "new") params.set("status", filter);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/inbox?${query}` : "/inbox";
}

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireOwnerId();
  const params = await searchParams;
  const filter = parseFilter(params.status);
  const where: Prisma.ContactMessageWhereInput =
    filter === "all" ? {} : { status: filter.toUpperCase() as MessageStatus };

  const [groups, total] = await Promise.all([
    prisma.contactMessage.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.contactMessage.count({ where }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(parsePage(params.page), pageCount);
  const messages = await prisma.contactMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: { id: true, name: true, email: true, subject: true, body: true, status: true, createdAt: true },
  });

  const counts = new Map(groups.map((g) => [g.status.toLowerCase(), g._count._all]));
  const allCount = groups.reduce((sum, g) => sum + g._count._all, 0);
  const now = new Date();
  const newCount = counts.get("new") ?? 0;

  return (
    <>
      <PageHeader
        kicker="Contact form"
        title="Inbox"
        description={
          newCount > 0
            ? `${newCount} new ${newCount === 1 ? "message" : "messages"} waiting.`
            : "Messages from the contact form on the portfolio."
        }
      />

      <FilterTabs
        label="Filter messages"
        tabs={INBOX_FILTERS.map((f) => ({
          href: hrefFor(f),
          label: LABELS[f],
          count: f === "all" ? allCount : (counts.get(f) ?? 0),
          active: f === filter,
        }))}
      />

      {messages.length === 0 ? (
        <EmptyState title={EMPTY[filter].title}>{EMPTY[filter].body}</EmptyState>
      ) : (
        <div className="border-rule bg-card overflow-hidden rounded-xl border">
          <table className="w-full table-fixed text-sm">
            <caption className="sr-only">
              {LABELS[filter]} messages, newest first, page {page} of {pageCount}
            </caption>
            <thead className="border-rule border-b">
              <tr className="text-muted-foreground text-left">
                <th scope="col" className="kicker px-4 py-3 font-medium sm:w-[34%]">
                  From
                </th>
                <th scope="col" className="kicker hidden px-4 py-3 font-medium sm:table-cell">
                  Subject
                </th>
                <th scope="col" className="kicker w-[92px] px-4 py-3 text-right font-medium sm:w-[120px]">
                  Received
                </th>
              </tr>
            </thead>
            <tbody className="divide-rule divide-y">
              {messages.map((m) => {
                const unread = m.status === "NEW";
                const summary = m.subject || excerpt(m.body, 90);
                return (
                  <tr key={m.id} className="group hover:bg-muted/50 relative transition-colors">
                    <td className="px-4 py-3.5 align-top">
                      <Link
                        href={`/inbox/${m.id}`}
                        className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                      >
                        <span className={cn("block truncate", unread ? "text-foreground font-semibold" : "text-ink-soft")}>
                          {m.name}
                        </span>
                      </Link>
                      <span className="text-muted-foreground block truncate text-xs">{m.email}</span>
                      <span className="text-ink-soft mt-1.5 block truncate sm:hidden">{summary}</span>
                      {m.status !== "NEW" || filter === "all" ? (
                        <StatusBadge status={m.status} className="mt-2 sm:hidden" />
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3.5 align-top sm:table-cell">
                      <span className={cn("block truncate", unread ? "text-foreground font-medium" : "text-ink-soft")}>
                        {summary}
                      </span>
                      <span className="mt-1.5 flex items-center gap-2">
                        <StatusBadge status={m.status} />
                      </span>
                    </td>
                    <td className="text-muted-foreground px-4 py-3.5 text-right align-top font-mono text-xs tabular-nums">
                      <time dateTime={m.createdAt.toISOString()} title={formatDateTime(m.createdAt)}>
                        {formatListDate(m.createdAt, now)}
                      </time>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} hrefFor={(p) => hrefFor(filter, p)} />
    </>
  );
}
