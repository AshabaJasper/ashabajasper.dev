import type { Metadata } from "next";
import type { CommentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAllPosts } from "@/lib/content/posts";
import { crossHref } from "@/lib/links";
import { formatDateTime } from "@/lib/contact/format";
import { EmptyState, FilterTabs, PageHeader, Pagination } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { CommentActions } from "@/components/admin/comments/comment-actions";
import { cn } from "@/lib/utils";
import { requireOwnerId } from "../require-owner";

export const metadata: Metadata = {
  title: "Comments",
  description: "Moderate comments on the blog: approve, mark as spam, restore, delete or reply.",
};

export const dynamic = "force-dynamic";

const TABS = ["pending", "approved", "spam"] as const;
type Tab = (typeof TABS)[number];
const PAGE_SIZE = 20;

const LABELS: Record<Tab, string> = { pending: "Pending", approved: "Approved", spam: "Spam" };
const EMPTY: Record<Tab, { title: string; body: string }> = {
  pending: { title: "Nothing waiting", body: "New comments wait here until you approve them. None are public before that." },
  approved: { title: "No approved comments", body: "Approved comments and your replies appear under each post." },
  spam: { title: "No spam", body: "Comments you mark as spam stay here, hidden from the blog, until you restore or delete them." },
};

function parseTab(value: string | undefined): Tab {
  return TABS.includes(value as Tab) ? (value as Tab) : "pending";
}

function hrefFor(tab: Tab, page = 1): string {
  const params = new URLSearchParams();
  if (tab !== "pending") params.set("status", tab);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/comments?${query}` : "/comments";
}

export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireOwnerId();
  const params = await searchParams;
  const tab = parseTab(params.status);
  const status = tab.toUpperCase() as CommentStatus;

  const [groups, posts] = await Promise.all([
    prisma.comment.groupBy({ by: ["status"], where: { isOwner: false }, _count: { _all: true } }),
    getAllPosts(),
  ]);
  const counts = new Map(groups.map((g) => [g.status.toLowerCase(), g._count._all]));
  // Owner replies are listed under the comment they answer, never on their own.
  const where = { status, isOwner: false };
  const total = counts.get(tab) ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requested = Number(params.page);
  const page = Number.isInteger(requested) && requested > 0 ? Math.min(requested, pageCount) : 1;

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: tab === "pending" ? "asc" : "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      replies: { orderBy: { createdAt: "asc" } },
      parent: { select: { authorName: true, body: true } },
    },
  });

  const titles = new Map(posts.map((p) => [p.slug, p.title]));

  return (
    <>
      <PageHeader
        kicker="Blog"
        title="Comments"
        description={
          (counts.get("pending") ?? 0) > 0
            ? `${counts.get("pending")} waiting for approval. Nothing is public until you approve it.`
            : "Visitor comments wait here for approval before they appear on the blog."
        }
      />

      <FilterTabs
        label="Filter comments"
        tabs={TABS.map((t) => ({ href: hrefFor(t), label: LABELS[t], count: counts.get(t) ?? 0, active: t === tab }))}
      />

      {comments.length === 0 ? (
        <EmptyState title={EMPTY[tab].title}>{EMPTY[tab].body}</EmptyState>
      ) : (
        <ol className="space-y-4">
          {comments.map((c) => {
            const title = titles.get(c.postSlug);
            return (
              <li key={c.id}>
                <article
                  aria-labelledby={`comment-${c.id}-author`}
                  className="border-rule bg-card rounded-xl border p-5 sm:p-6"
                >
                  <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-sm">
                        On{" "}
                        <a href={crossHref("admin", "blog", `/${c.postSlug}`)} className="link">
                          {title ?? c.postSlug}
                        </a>
                        {!title ? <span className="ml-1">(no longer published)</span> : null}
                      </p>
                      <h2 id={`comment-${c.id}-author`} className="mt-1.5 text-[1.02rem] font-semibold">
                        {c.authorName}
                        {c.authorEmail ? (
                          <span className="text-muted-foreground ml-2 text-sm font-normal break-all">{c.authorEmail}</span>
                        ) : null}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={c.status} />
                      <time
                        dateTime={c.createdAt.toISOString()}
                        className="text-muted-foreground font-mono text-xs tabular-nums"
                      >
                        {formatDateTime(c.createdAt)}
                      </time>
                    </div>
                  </header>

                  {c.parent ? (
                    <p className="border-rule text-muted-foreground mt-4 border-l-2 pl-3 text-sm">
                      In reply to {c.parent.authorName}
                    </p>
                  ) : null}

                  <div className="mt-4 text-[0.98rem] leading-[1.65] break-words whitespace-pre-wrap">{c.body}</div>

                  {c.replies.length > 0 ? (
                    <ol aria-label="Replies" className="border-rule mt-5 space-y-3 border-l-2 pl-4">
                      {c.replies.map((r) => (
                        <li key={r.id} className="text-sm">
                          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={cn("font-medium", r.isOwner && "text-primary")}>
                              {r.authorName}
                              {r.isOwner ? <span className="text-muted-foreground font-normal"> (you)</span> : null}
                            </span>
                            {r.status !== "APPROVED" ? <StatusBadge status={r.status} /> : null}
                            <time dateTime={r.createdAt.toISOString()} className="text-muted-foreground font-mono text-xs">
                              {formatDateTime(r.createdAt)}
                            </time>
                          </p>
                          <p className="text-ink-soft mt-1 leading-relaxed break-words whitespace-pre-wrap">{r.body}</p>
                        </li>
                      ))}
                    </ol>
                  ) : null}

                  <CommentActions
                    id={c.id}
                    status={c.status}
                    canReply={c.parentId === null && c.status !== "SPAM"}
                    authorName={c.authorName}
                    replyCount={c.replies.length}
                  />
                </article>
              </li>
            );
          })}
        </ol>
      )}

      <Pagination page={page} pageCount={pageCount} hrefFor={(p) => hrefFor(tab, p)} />
    </>
  );
}
