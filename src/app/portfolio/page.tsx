import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { EmailLink } from "@/components/portfolio/email-link";
import { Terminal } from "@/components/portfolio/terminal";
import { TERM_INTRO_SCRIPT } from "@/components/portfolio/terminal-intro";
import { WorkCard } from "@/components/portfolio/work-card";
import { WorkMapSection } from "@/components/portfolio/work-map-section";
import { ArrowLink, SectionHeading, buttonPrimary, buttonSecondary } from "@/components/portfolio/ui";
import { formatDate } from "@/components/portfolio/format";
import { Backdrop } from "@/components/shared/backdrop";
import { KbdHint } from "@/components/shared/kbd-hint";
import { Magnetic } from "@/components/shared/motion";
import { experience, experiencePeriod } from "@/data/experience";
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

/** The roles shown on the home page; the full history lives on /cv. */
const EXPERIENCE_HIGHLIGHT = ["persmon", "reveloop", "uganda-bookshop", "learnnovate"];

export default async function HomePage() {
  const featured = featuredWork();
  const allPosts = await getAllPosts();
  const posts = allPosts.slice(0, 3);
  const highlights = EXPERIENCE_HIGHLIGHT.map((id) => experience.find((e) => e.id === id)).filter((e) => e !== undefined);
  const termPosts = allPosts.slice(0, 5).map((post) => ({
    title: post.title,
    date: post.date,
    href: crossHref("portfolio", "blog", `/${post.slug}`),
  }));

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot close the script element.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()).replace(/</g, "\\u003c") }}
      />

      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative isolate overflow-hidden">
        <Backdrop className="-z-10" />
        <div className="container-page grid grid-cols-[minmax(0,1fr)] items-center gap-x-12 gap-y-14 pt-10 pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pt-24 lg:pb-32">
          <div>
            <p className="kicker reveal flex items-center gap-2.5">
              <span aria-hidden className="relative flex size-2">
                <span className="bg-primary absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden" />
                <span className="bg-primary relative size-2 rounded-full" />
              </span>
              {profile.location}
            </p>
            <h1 id="hero-title" className="font-display mt-6 text-[clamp(3.6rem,12.5vw,8.6rem)] leading-[0.86] tracking-[-0.055em]">
              <span className="rise-line" style={{ "--reveal-delay": "60ms" } as React.CSSProperties}>
                <span>Ashaba</span>
              </span>
              <span className="rise-line" style={{ "--reveal-delay": "160ms" } as React.CSSProperties}>
                <span>
                  Jasper<span className="text-primary">.</span>
                </span>
              </span>
            </h1>
            <p
              className="reveal text-foreground mt-7 font-mono text-[0.8rem] leading-relaxed sm:text-[0.86rem]"
              style={{ "--reveal-delay": "300ms" } as React.CSSProperties}
            >
              {profile.headline.split(", ").map((role, i) => (
                <span key={role}>
                  {i > 0 ? <span aria-hidden className="text-primary px-2">/</span> : null}
                  {i > 0 ? <span className="sr-only">, </span> : null}
                  {role}
                </span>
              ))}
            </p>
            <p
              className="reveal text-ink-soft mt-4 max-w-[44ch] text-[1.08rem] leading-[1.55] sm:text-[1.2rem]"
              style={{ "--reveal-delay": "360ms" } as React.CSSProperties}
            >
              {profile.heroLine}
            </p>
            <div
              id="hero-actions"
              className="reveal mt-8 flex flex-wrap items-center gap-3"
              style={{ "--reveal-delay": "440ms" } as React.CSSProperties}
            >
              <Magnetic>
                <EmailLink placement="hero" className={buttonPrimary}>
                  Email me
                  <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
                </EmailLink>
              </Magnetic>
              <Magnetic>
                <a href="#work" className={buttonSecondary}>
                  See selected work
                  <ArrowDown aria-hidden className="size-4" strokeWidth={1.75} />
                </a>
              </Magnetic>
            </div>
            <KbdHint className="reveal mt-7" />
          </div>

          <div id="terminal" className="reveal scroll-mt-24" style={{ "--reveal-delay": "250ms" } as React.CSSProperties}>
            <script dangerouslySetInnerHTML={{ __html: TERM_INTRO_SCRIPT }} />
            <Terminal posts={termPosts} blogHref={crossHref("portfolio", "blog", "/")} />
            <p className="text-muted-foreground mt-3 text-center font-mono text-[0.72rem]">
              A real terminal. Try <span className="text-foreground">projects</span>, <span className="text-foreground">stack</span> or{" "}
              <span className="text-foreground">sudo</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section id="work" aria-labelledby="work-title" className="scroll-mt-20">
        <div className="container-page py-20 sm:py-28">
          <SectionHeading id="work-title" index="01" kicker="Selected work" title="Five systems, in detail.">
            <ArrowLink href="/work">All {work.length} projects</ArrowLink>
          </SectionHeading>
          <div className="mt-14 grid gap-x-8 gap-y-20 md:grid-cols-2 sm:mt-16">
            {featured.map((item, i) => (
              <WorkCard key={item.slug} item={item} index={i} large={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* Kinetic band: the four kinds of work, drifting with the scroll. */}
      <div aria-hidden className="border-rule overflow-hidden border-y py-6 sm:py-8">
        <p className="scroll-drift font-display text-muted-foreground/35 text-[clamp(3rem,9vw,7.5rem)] leading-none whitespace-nowrap">
          Systems <span className="text-primary/70">*</span> Websites <span className="text-primary/70">*</span> Online stores{" "}
          <span className="text-primary/70">*</span> Mobile apps <span className="text-primary/70">*</span> Data pipelines{" "}
          <span className="text-primary/70">*</span> Applied AI
        </p>
      </div>

      {/* Work map */}
      <section aria-labelledby="map-title">
        <div className="container-page py-20 sm:py-28">
          <SectionHeading id="map-title" index="02" kicker="Work map" title={`All ${work.length} projects, mapped.`}>
            <p className="text-ink-soft max-w-[38ch] text-[0.95rem] leading-relaxed sm:text-right">
              One mark per project. Group them, highlight a technology, then open any one.
            </p>
          </SectionHeading>
          <div className="mt-12">
            <WorkMapSection />
          </div>
        </div>
      </section>

      {/* Experience highlight */}
      <section aria-labelledby="experience-title" className="border-rule border-t">
        <div className="container-page grid gap-12 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:gap-16">
          <div>
            <SectionHeading id="experience-title" index="03" kicker="Experience" title="Where the work happened." />
            <p className="text-ink-soft mt-6 max-w-[44ch] leading-relaxed">
              Most recently, AI and data systems for a US radiology network. Before that, pipelines, models and stores for businesses in
              Kampala.
            </p>
            <Link href="/cv" className={`${buttonPrimary} mt-8`}>
              Read the full CV
              <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
            </Link>
          </div>
          <ol className="border-rule border-t">
            {highlights.map((entry) => (
              <li key={entry.id} className="scroll-reveal border-rule grid gap-1.5 border-b py-6 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-6">
                <p className="text-muted-foreground pt-1 font-mono text-[0.75rem] tabular-nums">{experiencePeriod(entry)}</p>
                <div>
                  <h3 className="text-[1.15rem] leading-snug font-semibold tracking-[-0.015em]">{entry.role}</h3>
                  <p className="text-ink-soft mt-0.5">{entry.organisation}</p>
                  <p className="text-muted-foreground mt-2 text-[0.93rem] leading-relaxed">{entry.highlights[0]}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Writing */}
      {posts.length > 0 ? (
        <section aria-labelledby="writing-title" className="border-rule border-t">
          <div className="container-page py-20 sm:py-28">
            <SectionHeading id="writing-title" index="04" kicker="Writing" title="Notes from the build.">
              <a
                href={crossHref("portfolio", "blog", "/")}
                className="group text-foreground inline-flex min-h-11 items-center gap-2 font-mono text-[0.82rem]"
              >
                <span className="decoration-primary underline-offset-4 group-hover:underline">All writing</span>
                <span aria-hidden className="text-primary transition-transform group-hover:translate-x-1">
                  &rarr;
                </span>
              </a>
            </SectionHeading>
            <ol className="border-rule mt-12 border-t">
              {posts.map((post) => (
                <li key={post.slug} className="border-rule border-b">
                  <a
                    href={crossHref("portfolio", "blog", `/${post.slug}`)}
                    className="group grid gap-2 py-7 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-baseline sm:gap-6"
                  >
                    <time dateTime={post.date} className="text-muted-foreground font-mono text-[0.75rem] tabular-nums">
                      {formatDate(post.date, "short")}
                    </time>
                    <span>
                      <span className="decoration-primary block text-[1.3rem] leading-snug font-semibold tracking-[-0.02em] underline-offset-[5px] group-hover:underline sm:text-[1.45rem]">
                        {post.title}
                      </span>
                      <span className="text-ink-soft mt-2 block max-w-[64ch] leading-relaxed">{post.description}</span>
                    </span>
                    <span className="text-muted-foreground font-mono text-[0.72rem] whitespace-nowrap">{post.readingMinutes} min read</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}
    </>
  );
}
