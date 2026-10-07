import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Title block at the top of every admin page. */
export function PageHeader({
  kicker,
  title,
  description,
  back,
  actions,
  className,
}: {
  kicker?: string;
  title: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 sm:mb-10", className)}>
      {back ? (
        <Link
          href={back.href}
          className="text-muted-foreground hover:text-foreground -ml-2 mb-4 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm transition-colors"
        >
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {kicker ? <p className="kicker">{kicker}</p> : null}
          <h1 className="mt-2 font-serif text-4xl leading-[1.05] tracking-[-0.015em] break-words sm:text-[2.75rem]">
            {title}
          </h1>
          {description ? <p className="text-muted-foreground mt-3 max-w-[62ch] text-[0.95rem]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

/** Calm empty state for lists. */
export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border-rule rounded-xl border border-dashed px-6 py-14 text-center">
      <p className="font-serif text-2xl">{title}</p>
      {children ? <div className="text-muted-foreground mx-auto mt-2 max-w-[46ch] text-sm">{children}</div> : null}
    </div>
  );
}

export interface FilterTab {
  href: string;
  label: string;
  count?: number;
  active: boolean;
}

/** Filter tabs as plain links, so each view has its own URL. */
export function FilterTabs({ tabs, label }: { tabs: FilterTab[]; label: string }) {
  return (
    <nav aria-label={label} className="border-rule -mx-4 mb-6 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm transition-colors",
                tab.active
                  ? "border-foreground text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {tab.label}
              {typeof tab.count === "number" ? (
                <span className="text-muted-foreground font-mono text-xs tabular-nums">{tab.count}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Previous and next links with the position in between. */
export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const linkClass =
    "border-rule hover:bg-muted inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors";
  return (
    <nav aria-label="Pages" className="mt-6 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass} rel="prev">
          Newer
        </Link>
      ) : (
        <span />
      )}
      <p className="text-muted-foreground font-mono text-xs tabular-nums">
        Page {page} of {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={linkClass} rel="next">
          Older
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
