import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/contact/format";
import { summarizeMeta } from "@/lib/contact/audit-meta";
import { EmptyState, PageHeader, Pagination } from "@/components/admin/page-header";
import { requireOwnerId } from "../require-owner";

export const metadata: Metadata = {
  title: "Audit log",
  description: "Every sign-in, setting change and moderation action in the admin, newest first.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function hrefFor(page: number): string {
  return page > 1 ? `/audit?page=${page}` : "/audit";
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireOwnerId();
  const params = await searchParams;
  const total = await prisma.auditLog.count();
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const requested = Number(params.page);
  const page = Number.isInteger(requested) && requested > 0 ? Math.min(requested, pageCount) : 1;

  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: { id: true, action: true, entityType: true, entityId: true, meta: true, createdAt: true },
  });

  return (
    <>
      <PageHeader
        kicker="Security"
        title="Audit log"
        description="What happened in the admin and when. Passwords, PINs and tokens are never recorded here."
      />

      {rows.length === 0 ? (
        <EmptyState title="Nothing recorded yet">Sign-ins and changes made in the admin are listed here.</EmptyState>
      ) : (
        <div className="border-rule bg-card overflow-hidden rounded-xl border">
          <table className="w-full table-fixed text-sm">
            <caption className="sr-only">
              Audit log, newest first, page {page} of {pageCount}
            </caption>
            <thead className="border-rule border-b">
              <tr className="text-left">
                <th scope="col" className="kicker w-[118px] px-4 py-3 font-medium sm:w-[168px]">
                  Time
                </th>
                <th scope="col" className="kicker px-4 py-3 font-medium">
                  Action
                </th>
                <th scope="col" className="kicker hidden px-4 py-3 font-medium sm:table-cell">
                  Entity
                </th>
                <th scope="col" className="kicker hidden px-4 py-3 font-medium md:table-cell">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-rule divide-y">
              {rows.map((row) => {
                const meta = summarizeMeta(row.meta);
                return (
                  <tr key={row.id} className="align-top">
                    <td className="text-muted-foreground px-4 py-3 font-mono text-xs tabular-nums sm:whitespace-nowrap">
                      <time dateTime={row.createdAt.toISOString()}>{formatDateTime(row.createdAt)}</time>
                    </td>
                    <td className="px-4 py-3 font-mono text-[0.8rem] break-words">
                      {row.action}
                      <span className="text-muted-foreground mt-1 block font-sans text-xs sm:hidden">
                        {[row.entityType, meta].filter(Boolean).join(", ")}
                      </span>
                      {meta ? <span className="text-muted-foreground mt-1 hidden font-sans text-xs sm:block md:hidden">{meta}</span> : null}
                    </td>
                    <td className="text-ink-soft hidden px-4 py-3 sm:table-cell">
                      {row.entityType || "None"}
                      {row.entityId ? (
                        <span className="text-muted-foreground block font-mono text-xs" title={row.entityId}>
                          {row.entityId.slice(0, 10)}
                        </span>
                      ) : null}
                    </td>
                    <td className="text-muted-foreground hidden px-4 py-3 text-xs md:table-cell">{meta || "None"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageCount={pageCount} hrefFor={hrefFor} />
    </>
  );
}
