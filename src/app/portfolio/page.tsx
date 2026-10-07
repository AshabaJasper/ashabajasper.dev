import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { EmailLink } from "@/components/portfolio/email-link";
import { WorkCard } from "@/components/portfolio/work-card";
import { ArrowLink, ExternalLink, SectionHeading, buttonPrimary, buttonSecondary } from "@/components/portfolio/ui";
import { formatDate } from "@/components/portfolio/format";
import { experience, experienceYears } from "@/data/experience";
import { profile } from "@/data/profile";
import { featuredWork, work } from "@/data/work";
import { getAllPosts } from "@/lib/content/posts";
import { crossHref } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";

export const metadata: Metadata = pageMetadata({
  site: "portfolio",
  path: "/",
  title: `${profile.name}, software engineer and data scientist`,
  description: profile.heroLine,
  absoluteTitle: true,
  type: "profile",
});

const ELSEWHERE = [
  { label: "GitHub", handle: "AshabaJasper", href: profile.links.github },
  { label: "LinkedIn", handle: "ashaba-jasper-joshua", href: profile.links.linkedin },
  { label: "X", handle: profile.xHandle, href: profile.links.x },
  { label: "Google Developers", handle: "g.dev/ashaba_jasper", href: profile.links.googleDevelopers },
] as const;

function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.fullName,
    alternateName: profile.name,
    jobTitle: profile.role,
    url: siteUrl("portfolio", "/"),
    image: siteUrl("portfolio", profile.avatar.src),
    email: `mailto:${profile.email}`,
    sameAs: Object.values(profile.links),
    address: { "@type": "PostalAddress", addressLocality: "Kampala", addressCountry: "UG" },
    worksFor: { "@type": "Organization", name: "Persmon Technologies", url: "https://persmontechnologies.com" },
    alumniOf: { "@type": "CollegeOrUniversity", name: profile.education.school },
  };
}

export default async function HomePage() {
  const featured = featuredWork();
  const posts = (await getAllPosts()).slice(0, 3);
  const current = experience.filter((entry) => entry.kind === "work");
  const education = experience.filter((entry) => entry.kind === "education");

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot close the script element.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <section aria-labelledby="hero-title" className="container-page pt-8 pb-20 sm:pt-16 sm:pb-28 lg:pt-24 lg:pb-36">
        <div className="grid items-center gap-x-16 gap-y-6 lg:grid-cols-[minmax(0,1fr)_auto]">
          <figure
            className="reveal lg:col-start-2 lg:row-start-1 lg:flex lg:flex-col lg:items-center"
            style={{ "--reveal-delay": "0ms" } as React.CSSProperties}
          >
            <div className="border-rule bg-muted relative size-[72px] overflow-hidden rounded-full border sm:size-24 lg:size-[clamp(16rem,26vw,20rem)]">
              <Image
                src={profile.avatar.src}
                alt={profile.avatar.alt}
                fill
                priority
                sizes="(min-width: 1024px) 320px, 96px"
                className="object-cover"
              />
            </div>
            <figcaption className="text-muted-foreground mt-5 hidden text-center font-mono text-[0.75rem] leading-relaxed lg:block">
              {profile.fullName}
            </figcaption>
          </figure>

          <div className="lg:col-start-1 lg:row-start-1">
            <p className="kicker reveal" style={{ "--reveal-delay": "60ms" } as React.CSSProperties}>
              {profile.location}
            </p>
            <h1
              id="hero-title"
              className="reveal mt-4 font-serif text-[clamp(3.5rem,11vw,6.5rem)] leading-[0.95] tracking-[-0.02em] sm:mt-5"
              style={{ "--reveal-delay": "120ms" } as React.CSSProperties}
            >
              Ashaba <em className="italic">Jasper</em>
            </h1>
            <p
              className="reveal text-ink-soft mt-5 max-w-[34ch] text-[1.12rem] leading-[1.5] sm:mt-7 sm:text-[1.3rem]"
              style={{ "--reveal-delay": "190ms" } as React.CSSProperties}
            >
              {profile.heroLine}
            </p>
            <div
              id="hero-actions"
              className="reveal mt-7 flex flex-wrap items-center gap-3 sm:mt-9"
              style={{ "--reveal-delay": "260ms" } as React.CSSProperties}
            >
              <a href="#work" className={buttonPrimary}>
                See selected work
                <ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />
              </a>
              <EmailLink placement="hero" className={buttonSecondary}>
                Email me
              </EmailLink>
            </div>
          </div>
        </div>
      </section>

      {/* Currently */}
      <section aria-labelledby="currently-title" className="border-rule border-t">
        <div className="container-page grid gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <SectionHeading id="currently-title" kicker="Currently" title="A software company and a non-profit." />
          <dl className="grid gap-10 sm:grid-cols-2 sm:gap-12">
            {current.map((item) => (
              <div key={item.organisation} className="border-rule border-t pt-5">
                <dt>
                  <span className="font-serif text-[1.65rem] leading-tight tracking-[-0.01em]">
                    {item.href ? (
                      <ExternalLink href={item.href} className="decoration-primary underline-offset-[5px] hover:underline">
                        {item.organisation}
                      </ExternalLink>
                    ) : (
                      item.organisation
                    )}
                  </span>
                  <span className="text-muted-foreground mt-1.5 block font-mono text-[0.78rem]">{item.role}</span>
                </dt>
                <dd className="text-ink-soft mt-3 leading-relaxed">{item.description}</dd>
                <dd className="text-muted-foreground mt-3 font-mono text-[0.78rem]">{experienceYears(item)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Selected work */}
      <section id="work" aria-labelledby="work-title" className="border-rule scroll-mt-20 border-t">
        <div className="container-page py-16 sm:py-24">
          <SectionHeading id="work-title" kicker="Selected work" title="Five systems, in detail.">
            <ArrowLink href="/work">All {work.length} projects</ArrowLink>
          </SectionHeading>
          <div className="mt-12 grid gap-x-8 gap-y-16 sm:mt-14 md:grid-cols-2 md:gap-y-20">
            {featured.map((item) => (
              <WorkCard key={item.slug} item={item} />
            ))}
          </div>
          <div className="mt-14 sm:mt-16">
            <Link href="/work" className={buttonSecondary}>
              See all {work.length} projects
            </Link>
          </div>
        </div>
      </section>

      {/* Writing */}
      {posts.length > 0 ? (
        <section aria-labelledby="writing-title" className="border-rule border-t">
          <div className="container-page py-16 sm:py-24">
            <SectionHeading id="writing-title" kicker="Writing" title="Notes from the build.">
              <a
                href={crossHref("portfolio", "blog", "/")}
                className="group text-foreground inline-flex min-h-11 items-center gap-1.5 text-[0.95rem] font-medium"
              >
                <span className="decoration-primary/60 underline-offset-4 group-hover:underline">All writing</span>
                <span aria-hidden className="text-primary">
                  &rarr;
                </span>
              </a>
            </SectionHeading>
            <ol className="border-rule mt-10 border-t">
              {posts.map((post) => (
                <li key={post.slug} className="border-rule border-b">
                  <a
                    href={crossHref("portfolio", "blog", `/${post.slug}`)}
                    className="group grid gap-2 py-7 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-8"
                  >
                    <time dateTime={post.date} className="text-muted-foreground pt-1.5 font-mono text-[0.78rem] tabular-nums">
                      {formatDate(post.date, "short")}
                    </time>
                    <span>
                      <span className="decoration-primary block font-serif text-[1.55rem] leading-tight tracking-[-0.01em] underline-offset-[5px] group-hover:underline">
                        {post.title}
                      </span>
                      <span className="text-ink-soft mt-2 block max-w-[62ch] leading-relaxed">{post.description}</span>
                      <span className="text-muted-foreground mt-2 block font-mono text-[0.75rem]">
                        {post.readingMinutes} min read
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* Education. Work entries already appear under "Currently". */}
      <section aria-labelledby="education-title" className="border-rule border-t">
        <div className="container-page grid gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <SectionHeading id="education-title" kicker="Education" title="Where I studied." />
          <ol className="border-rule border-t">
            {education.map((entry) => {
              const years = experienceYears(entry);
              return (
                <li key={entry.organisation} className="border-rule grid gap-1 border-b py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6">
                  <div>
                    <h3 className="font-serif text-[1.5rem] leading-tight tracking-[-0.01em]">
                      {entry.href ? (
                        <ExternalLink href={entry.href} className="decoration-primary underline-offset-[5px] hover:underline">
                          {entry.organisation}
                        </ExternalLink>
                      ) : (
                        entry.organisation
                      )}
                    </h3>
                    <p className="text-ink-soft mt-1">{entry.role}</p>
                  </div>
                  {years ? (
                    <p className="text-muted-foreground font-mono text-[0.78rem] tabular-nums sm:pt-2">{years}</p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Elsewhere */}
      <section aria-labelledby="elsewhere-title" className="border-rule border-t">
        <div className="container-page grid gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
          <SectionHeading id="elsewhere-title" kicker="Elsewhere" title="Find me online." />
          <ul className="border-rule border-t">
            {ELSEWHERE.map((link) => (
              <li key={link.label} className="border-rule border-b">
                <a
                  href={link.href}
                  target="_blank"
                  rel="me noopener"
                  className="group flex min-h-14 items-center justify-between gap-4 py-3"
                >
                  <span className="text-[1.05rem]">{link.label}</span>
                  <span className="text-muted-foreground group-hover:text-foreground flex min-w-0 items-center gap-2 font-mono text-[0.8rem] transition-colors">
                    <span className="truncate">{link.handle}</span>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
                  </span>
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
            <li className="border-rule border-b">
              <EmailLink placement="elsewhere" className="group flex min-h-14 items-center justify-between gap-4 py-3">
                <span className="text-[1.05rem]">Email</span>
                <span className="text-muted-foreground group-hover:text-foreground truncate font-mono text-[0.8rem] transition-colors">
                  {profile.email}
                </span>
              </EmailLink>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
