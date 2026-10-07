import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ArrowLink, PageHeader, StackLine } from "@/components/portfolio/ui";
import { allWork, sectorSlug, sectors, sectorYear, work, workKinds, type WorkItem } from "@/data/work";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  site: "portfolio",
  path: "/work",
  title: "Work",
  description:
    "All 47 projects by Ashaba Jasper: hotel, operations and civic data systems, online stores, mobile apps and websites for organisations in Uganda and East Africa.",
});

interface WorkPageProps {
  searchParams: Promise<{ sector?: string | string[] }>;
}

function WorkRow({ item }: { item: WorkItem }) {
  return (
    <li className="border-rule grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-2 border-b py-6 md:grid-cols-[minmax(0,1fr)_14rem]">
      <div className="min-w-0">
        <h3 className="font-serif text-[1.4rem] leading-tight tracking-[-0.01em]">
          {item.featured ? (
            <Link href={`/work/${item.slug}`} className="decoration-primary underline-offset-[5px] hover:underline">
              {item.name}
              <span className="text-primary ml-2 align-middle font-sans text-[0.72rem] font-medium tracking-[0.12em] uppercase">
                Case study
              </span>
            </Link>
          ) : (
            item.name
          )}
        </h3>
        <p className="text-ink-soft mt-2 max-w-[64ch] leading-relaxed">{item.summary}</p>
        <StackLine stack={item.stack} className="mt-2.5" />
      </div>
      <div className="flex min-w-0 items-start justify-between gap-4 md:flex-col md:items-end md:justify-start md:text-right">
        <p className="text-muted-foreground shrink-0 pt-1 font-mono text-[0.78rem] tabular-nums">{sectorYear(item)}</p>
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener"
            className="text-muted-foreground hover:text-foreground -mt-2 inline-flex min-h-11 min-w-0 max-w-full items-center gap-1 font-mono text-[0.78rem] transition-colors md:-mr-1 md:mt-0"
          >
            <span className="truncate">{new URL(item.url).hostname}</span>
            <ArrowUpRight aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="sr-only">, visit {item.name} (opens in a new tab)</span>
          </a>
        ) : null}
      </div>
    </li>
  );
}

export default async function WorkPage({ searchParams }: WorkPageProps) {
  const raw = (await searchParams).sector;
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const active = sectors.find((s) => s.slug === requested) ?? null;
  const items = allWork().filter((item) => !active || sectorSlug(item.sector) === active.slug);

  const chip = (selected: boolean) =>
    cn(
      "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 whitespace-nowrap text-[0.88rem] transition-colors",
      selected
        ? "border-foreground bg-foreground text-background"
        : "border-rule text-ink-soft hover:border-foreground/30 hover:text-foreground",
    );

  const mainSectors = sectors.filter((s) => s.count > 1);
  const moreSectors = sectors.filter((s) => s.count === 1);
  const moreOpen = !!active && active.count === 1;

  const sectorLink = (s: (typeof sectors)[number]) => (
    <Link
      href={`/work?sector=${s.slug}`}
      scroll={false}
      aria-current={active?.slug === s.slug ? "page" : undefined}
      className={chip(active?.slug === s.slug)}
    >
      {s.label}
      <span className="font-mono text-[0.75rem] opacity-70">{s.count}</span>
    </Link>
  );

  return (
    <>
      <PageHeader
        kicker="Work"
        title="Every project, in one list."
        lede={
          <p>
            {work.length} projects: systems that run hotels, firms and public votes, online stores, mobile apps and
            websites for organisations in Uganda and East Africa. All of them were built at
            Persmon Technologies.
          </p>
        }
      >
        {/* id="hero-actions": the sticky mobile bar waits until this scrolls out of view. */}
        <div id="hero-actions" className="mt-5">
          <ArrowLink href="/contact">Tell me about your project</ArrowLink>
        </div>
      </PageHeader>

      <div className="container-page">
        <nav aria-label="Filter by sector" className="border-rule border-y py-5">
          <p className="kicker mb-3" id="sector-filter-label">
            Sector
          </p>
          <ul
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:thin] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
            aria-labelledby="sector-filter-label"
          >
            <li>
              <Link href="/work" scroll={false} aria-current={active ? undefined : "page"} className={chip(!active)}>
                All
                <span className="font-mono text-[0.75rem] opacity-70">{work.length}</span>
              </Link>
            </li>
            {mainSectors.map((s) => (
              <li key={s.slug}>{sectorLink(s)}</li>
            ))}
          </ul>
          {/* Single-project sectors sit behind a native disclosure so the filter stays a short row. */}
          <details className="group mt-3" open={moreOpen}>
            <summary className="text-ink-soft hover:text-foreground inline-flex min-h-11 cursor-pointer list-none items-center gap-2 text-[0.9rem] [&::-webkit-details-marker]:hidden">
              <span aria-hidden className="text-primary font-mono transition-transform duration-200 group-open:rotate-90">
                &rsaquo;
              </span>
              {moreSectors.length} more sectors with one project each
            </summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {moreSectors.map((s) => (
                <li key={s.slug}>{sectorLink(s)}</li>
              ))}
            </ul>
          </details>
        </nav>

        <p className="text-muted-foreground mt-6 text-sm" aria-live="polite">
          {active
            ? `Showing ${items.length} ${items.length === 1 ? "project" : "projects"} in ${active.label}.`
            : `Showing all ${items.length} projects.`}
        </p>

        {workKinds.map(({ kind, label }) => {
          const group = items.filter((item) => item.kind === kind);
          if (group.length === 0) return null;
          return (
            <section key={kind} aria-labelledby={`kind-${kind}`} className="mt-14 sm:mt-20">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id={`kind-${kind}`} className="font-serif text-[2rem] leading-none tracking-[-0.015em] sm:text-[2.5rem]">
                  {label}
                </h2>
                <p className="text-muted-foreground font-mono text-[0.78rem] tabular-nums">
                  {group.length} {group.length === 1 ? "project" : "projects"}
                </p>
              </div>
              <ul className="border-rule mt-6 border-t">
                {group.map((item) => (
                  <WorkRow key={item.slug} item={item} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
