import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, LayoutGrid, Map, Star } from "lucide-react";
import { KIND_ICON, sectorIcon } from "@/components/portfolio/icons";
import { ArrowLink, PageHeader, StackLine } from "@/components/portfolio/ui";
import { WorkMapSection } from "@/components/portfolio/work-map-section";
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

function SectorGlyph({ sector }: { sector: string }) {
  const Icon = sectorIcon(sector);
  return <Icon aria-hidden className="text-primary size-3.5 shrink-0" strokeWidth={1.75} />;
}

function WorkRow({ item }: { item: WorkItem }) {
  return (
    <li
      id={item.slug}
      className="border-rule target:bg-accent/60 group/row grid scroll-mt-24 grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-2 border-b py-6 transition-colors md:grid-cols-[minmax(0,1fr)_14rem] md:px-3 target:rounded-[var(--radius-md)] target:px-3"
    >
      <div className="min-w-0">
        <h3 className="text-[1.2rem] leading-tight font-semibold tracking-[-0.02em] sm:text-[1.3rem]">
          {item.featured ? (
            <Link href={`/work/${item.slug}`} className="decoration-primary underline-offset-[5px] hover:underline">
              {item.name}
              <span className="border-primary/50 text-primary ml-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 align-middle font-mono text-[0.66rem] font-medium tracking-[0.08em] uppercase">
                <Star aria-hidden className="size-3 fill-current" strokeWidth={2} />
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
        <p className="text-muted-foreground inline-flex shrink-0 items-center gap-1.5 pt-1 font-mono text-[0.78rem] tabular-nums">
          <SectorGlyph sector={item.sector} />
          {sectorYear(item)}
        </p>
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
      <SectorGlyph sector={s.label} />
      {s.label}
      <span className="font-mono text-[0.75rem] opacity-70">{s.count}</span>
    </Link>
  );

  return (
    <>
      <PageHeader
        kicker="Work"
        title="Every project, in one place."
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

      <section aria-labelledby="map-title" className="container-page pb-20 sm:pb-28">
        <h2 id="map-title" className="kicker mb-6 flex items-center gap-2.5">
          <Map aria-hidden className="text-primary size-4" strokeWidth={1.9} />
          Work map
        </h2>
        <WorkMapSection />
      </section>

      <div className="container-page">
        <h2 className="font-display mb-8 flex items-center gap-4 text-[clamp(2rem,4.6vw,3.4rem)] leading-none">
          <span aria-hidden className="bg-accent text-primary inline-flex size-11 shrink-0 items-center justify-center rounded-[12px]">
            <LayoutGrid className="size-5" strokeWidth={1.75} />
          </span>
          The full list
        </h2>
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
          const KindIcon = KIND_ICON[kind];
          return (
            <section key={kind} aria-labelledby={`kind-${kind}`} className="mt-14 sm:mt-20">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id={`kind-${kind}`} className="font-display flex items-center gap-3 text-[1.7rem] leading-none sm:text-[2.1rem]">
                  <span
                    aria-hidden
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-[11px] border"
                    style={{
                      color: `var(--viz-${kind})`,
                      background: `color-mix(in srgb, var(--viz-${kind}) 14%, var(--card))`,
                      borderColor: `color-mix(in srgb, var(--viz-${kind}) 45%, transparent)`,
                    }}
                  >
                    <KindIcon className="size-5" strokeWidth={1.9} />
                  </span>
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
