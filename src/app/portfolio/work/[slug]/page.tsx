import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, Check, Layers, Lightbulb, Link2, Workflow, type LucideIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { EmailLink } from "@/components/portfolio/email-link";
import { WorkImage } from "@/components/portfolio/work-image";
import { vtImage, vtTitle } from "@/components/portfolio/work-card";
import { Backdrop } from "@/components/shared/backdrop";
import { Magnetic } from "@/components/shared/motion";
import { ExternalLink, StackLine, buttonPrimary, buttonSecondary } from "@/components/portfolio/ui";
import { Diagram } from "@/components/portfolio/diagram";
import { KIND_ICON, sectorIcon } from "@/components/portfolio/icons";
import { diagrams } from "@/data/diagrams";
import { featuredWork, workBySlug, workKinds } from "@/data/work";
import { getAllPosts } from "@/lib/content/posts";
import { crossHref } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";

interface CaseStudyProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return featuredWork().map((item) => ({ slug: item.slug }));
}

function caseStudyFor(slug: string) {
  const item = workBySlug(slug);
  return item && item.featured && item.caseStudy ? { ...item, caseStudy: item.caseStudy } : null;
}

export async function generateMetadata({ params }: CaseStudyProps): Promise<Metadata> {
  const item = caseStudyFor((await params).slug);
  if (!item) return { title: "Case study not found", description: "There is no case study at this address." };
  return pageMetadata({
    site: "portfolio",
    path: `/work/${item.slug}`,
    title: item.name,
    // The one-sentence summary, which stays close to the 160 characters search results show.
    description: item.summary,
    image: siteUrl("portfolio", `/og/work/${item.slug}`),
    imageAlt: `${item.name}: ${item.caseStudy.headline}`,
    type: "article",
  });
}

export default async function CaseStudyPage({ params }: CaseStudyProps) {
  const item = caseStudyFor((await params).slug);
  if (!item) notFound();
  const study = item.caseStudy;
  // Persmon pages say "What we built"; solo work would say "What I built".
  const solo = !study.role.startsWith("Built at");
  // The first external link is the live site or demo ("Open the public demo", "Visit ugandabookshop.com").
  const liveLink = item.url ? (study.links.find((link) => link.href === item.url) ?? null) : null;

  const featured = featuredWork();
  const index = featured.findIndex((f) => f.slug === item.slug);
  const previous = featured[(index - 1 + featured.length) % featured.length];
  const next = featured[(index + 1) % featured.length];

  // Blog links only appear once the post is published, so they never lead to a 404.
  const published = new Map((await getAllPosts()).map((post) => [post.slug, post.title]));
  const links = study.links
    .map((link) => {
      if (link.site !== "blog") return { label: link.label, href: link.href, external: true };
      const slug = link.href.replace(/^\//, "");
      const title = published.get(slug);
      return title ? { label: title, href: crossHref("portfolio", "blog", link.href), external: false } : null;
    })
    .filter((link): link is { label: string; href: string; external: boolean } => link !== null);

  const kindLabel = workKinds.find((k) => k.kind === item.kind)?.label.replace(/s$/, "") ?? item.kind;
  const meta: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Role", value: study.role, icon: BriefcaseBusiness },
    { label: "Kind", value: kindLabel, icon: KIND_ICON[item.kind] },
    { label: "Sector", value: item.sector, icon: sectorIcon(item.sector) },
    ...(item.year !== null ? [{ label: "Year", value: String(item.year), icon: CalendarDays }] : []),
  ];
  const diagram = diagrams[item.slug];

  return (
    <article>
      <header className="relative isolate overflow-hidden">
        <Backdrop className="-z-10" />
        <div className="container-page pt-12 pb-10 sm:pt-20 sm:pb-14">
        <nav aria-label="Breadcrumb">
          <Link href="/work" className="kicker hover:text-foreground inline-flex min-h-11 items-center transition-colors">
            <span aria-hidden className="text-primary mr-2">
              &larr;
            </span>
            work / case study
          </Link>
        </nav>
        <h1
          className="font-display mt-4 w-fit max-w-[18ch] text-[clamp(2.5rem,7vw,5.25rem)] leading-[0.95]"
          style={{ viewTransitionName: vtTitle(item.slug) }}
        >
          {item.name}
        </h1>
        <p className="text-ink-soft mt-6 max-w-[46ch] text-[1.25rem] leading-snug sm:text-[1.5rem]">{study.headline}</p>

        {/* id="hero-actions": the sticky mobile bar waits until these scroll out of view. */}
        <div id="hero-actions" className="mt-8 flex flex-wrap gap-3">
          <Magnetic>
            <Link href="/contact" className={buttonPrimary}>
              Discuss a similar project
            </Link>
          </Magnetic>
          {liveLink ? (
            <Magnetic>
              <ExternalLink href={liveLink.href} className={buttonSecondary}>
                {liveLink.label}
              </ExternalLink>
            </Magnetic>
          ) : null}
        </div>

        <dl className="border-rule mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-t pt-6 sm:flex sm:flex-wrap sm:gap-x-14">
          {meta.map((m) => (
            <div key={m.label}>
              <dt className="kicker">{m.label}</dt>
              <dd className="mt-1.5 inline-flex items-center gap-2 text-[0.95rem]">
                <m.icon aria-hidden className="text-primary size-4 shrink-0" strokeWidth={1.75} />
                {m.value}
              </dd>
            </div>
          ))}
          <div className="col-span-2 sm:min-w-[16rem] sm:flex-1">
            <dt className="kicker">Stack</dt>
            <dd className="mt-2">
              <StackLine stack={study.stack} />
            </dd>
          </div>
        </dl>
        </div>
      </header>

      <div className="container-page">
        <div className="border-rule bg-card rounded-[var(--radius-xl)] border p-2 sm:p-3">
          <div className="overflow-hidden rounded-[calc(var(--radius-xl)-6px)]" style={{ viewTransitionName: vtImage(item.slug) }}>
            <WorkImage
          slug={item.slug}
          name={item.name}
          alt={item.screenshotAlt}
              className="rounded-none border-0"
              sizes="(min-width: 1200px) 1112px, (min-width: 640px) calc(100vw - 72px), calc(100vw - 48px)"
              priority
            />
          </div>
        </div>
      </div>

      {diagram ? (
        <section aria-labelledby="how-title" className="container-page mt-16 sm:mt-24">
          <h2 id="how-title" className="kicker mb-5 flex items-center gap-2.5">
            <Workflow aria-hidden className="text-primary size-4" strokeWidth={1.9} />
            How it works
          </h2>
          <Diagram spec={diagram} id={`dg-${item.slug}`} />
        </section>
      ) : null}

      {/* Phones: each label sits close above its content, with the large space between sections. */}
      <div className="container-page mt-16 grid gap-y-4 sm:mt-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-x-16 lg:gap-y-16">
        <h2 className="kicker flex items-center gap-2.5 lg:pt-2">
          <Lightbulb aria-hidden className="text-primary size-4" strokeWidth={1.9} />
          Context
        </h2>
        <p className="text-ink-soft max-w-[62ch] text-[1.12rem] leading-[1.7]">{study.context}</p>

        <h2 className="kicker mt-10 flex items-center gap-2.5 lg:mt-0 lg:pt-2">
          <Layers aria-hidden className="text-primary size-4" strokeWidth={1.9} />
          {solo ? "What I built" : "What we built"}
        </h2>
        <ul className="grid max-w-[62rem] gap-3 sm:grid-cols-2">
          {study.built.map((line, i) => (
            <li
              key={line}
              data-reveal
              style={{ "--i": i % 2 } as React.CSSProperties}
              className="border-rule bg-card/70 flex gap-3.5 rounded-[var(--radius-lg)] border p-4 leading-relaxed"
            >
              <span aria-hidden className="bg-accent text-primary inline-flex size-7 shrink-0 items-center justify-center rounded-[8px]">
                <Check className="size-4" strokeWidth={2.25} />
              </span>
              <span className="pt-0.5">{line}</span>
            </li>
          ))}
        </ul>

        {links.length > 0 ? (
          <>
            <h2 className="kicker mt-10 flex items-center gap-2.5 lg:mt-0 lg:pt-2">
              <Link2 aria-hidden className="text-primary size-4" strokeWidth={1.9} />
              {item.url ? "Links" : "Read more"}
            </h2>
            <ul className="max-w-[62ch] space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <ExternalLink href={link.href} className="link inline-flex min-h-11 items-center text-[1.05rem]">
                      {link.label}
                    </ExternalLink>
                  ) : (
                    <a href={link.href} className="link inline-flex min-h-11 items-center text-[1.05rem]">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      <nav aria-label="More case studies" className="container-page mt-20 sm:mt-28">
        <div className="border-rule grid border-y sm:grid-cols-2">
          <Link
            href={`/work/${previous.slug}`}
            rel="prev"
            className="group border-rule flex flex-col gap-1.5 border-b py-7 sm:border-r sm:border-b-0 sm:pr-8"
          >
            <span className="kicker inline-flex items-center gap-1.5">
              <ArrowLeft aria-hidden className="text-primary size-3.5" strokeWidth={2} />
              Previous
            </span>
            <span className="decoration-primary font-display text-[1.4rem] leading-tight underline-offset-[5px] group-hover:underline">
              {previous.name}
            </span>
          </Link>
          <Link href={`/work/${next.slug}`} rel="next" className="group flex flex-col gap-1.5 py-7 sm:items-end sm:pl-8 sm:text-right">
            <span className="kicker inline-flex items-center gap-1.5">
              Next
              <ArrowRight aria-hidden className="text-primary size-3.5" strokeWidth={2} />
            </span>
            <span className="decoration-primary font-display text-[1.4rem] leading-tight underline-offset-[5px] group-hover:underline">
              {next.name}
            </span>
          </Link>
        </div>
      </nav>

      <section aria-labelledby="cta-title" className="container-page mt-20 sm:mt-28">
        <div className="bg-card border-rule relative isolate overflow-hidden rounded-[var(--radius-xl)] border px-6 py-12 sm:px-12 sm:py-16">
          <div aria-hidden className="dot-grid absolute inset-0 -z-10 opacity-70" />
          <h2 id="cta-title" className="font-display max-w-[18ch] text-[clamp(2rem,4.6vw,3.2rem)] leading-[1]">
            Have a similar system to build?
          </h2>
          <p className="text-ink-soft mt-4 max-w-[52ch] leading-relaxed">
            Tell me what it needs to do and who will use it. I read every message and reply personally.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <EmailLink placement="case-study" className={buttonPrimary}>
              Email me
            </EmailLink>
            <Link href="/contact" className={buttonSecondary}>
              Use the contact form
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
