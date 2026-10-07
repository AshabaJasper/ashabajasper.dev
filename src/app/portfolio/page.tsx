import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Code,
  Database,
  Download,
  Mail,
  Map,
  PenLine,
  Sparkles,
} from "lucide-react";
import { EmailLink } from "@/components/portfolio/email-link";
import { Terminal } from "@/components/portfolio/terminal";
import { TERM_INTRO_SCRIPT } from "@/components/portfolio/terminal-intro";
import { FeaturedStack, NumbersBand, TechMarquee, Wordmarks } from "@/components/portfolio/showcase";
import { WorkMapSection } from "@/components/portfolio/work-map-section";
import { ArrowLink, SectionHeading, buttonPrimary, buttonSecondary } from "@/components/portfolio/ui";
import { formatDate } from "@/components/portfolio/format";
import { Backdrop } from "@/components/shared/backdrop";
import { Magnetic } from "@/components/shared/motion";
import { experience, experiencePeriod } from "@/data/experience";
import { profile } from "@/data/profile";
import { highlights as byTheNumbers, yearsShipping } from "@/data/highlights";
import { featuredWork, sectors, work } from "@/data/work";
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

const CV_PDF = "/cv/Ashaba-Joshua-Jasper-CV-2026.pdf";

const ROLES = [
  { label: "Data Scientist", icon: Database },
  { label: "AI/ML Engineer", icon: BrainCircuit },
  { label: "Full-Stack Developer", icon: Code },
];

/** The roles shown on the home page; the full history lives on /cv. */
const EXPERIENCE_HIGHLIGHT = ["persmon", "reveloop", "uganda-bookshop", "learnnovate"];

export default async function HomePage() {
  const featured = featuredWork();
  const today = new Date();
  const now = { year: today.getUTCFullYear(), month: today.getUTCMonth() + 1 };
  const figures = byTheNumbers(now);
  const glance = [
    { value: String(work.length), label: "Projects shipped" },
    { value: String(sectors.length), label: "Sectors" },
    { value: `${yearsShipping(now)}+`, label: "Years building" },
  ];
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
        <div data-parallax="0.35" style={{ "--speed": 0.35 } as React.CSSProperties} className="absolute inset-0 -z-10">
          <Backdrop />
        </div>
        <div className="container-page grid grid-cols-[minmax(0,1fr)] items-center gap-x-12 gap-y-14 pt-10 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:pt-20 lg:pb-24">
          <div>
            {/* Identity first, once: photo, name, where. */}
            <div className="reveal flex items-center gap-4">
              <div className="ring-primary/50 ring-offset-background relative size-14 shrink-0 overflow-hidden rounded-full ring-2 ring-offset-2 sm:size-16">
                <Image src={profile.avatar.src} alt={profile.avatar.alt} fill priority sizes="64px" className="object-cover" />
              </div>
              <div>
                <p className="text-foreground text-[1.05rem] font-semibold tracking-[-0.01em]">{profile.name}</p>
                <p className="text-muted-foreground mt-0.5 flex items-center gap-2 font-mono text-[0.74rem]">
                  <span aria-hidden className="relative flex size-2">
                    <span className="bg-primary absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden" />
                    <span className="bg-primary relative size-2 rounded-full" />
                  </span>
                  {profile.location}
                </p>
              </div>
            </div>

            {/* The promise is the headline; the name already sits above it. */}
            <h1 id="hero-title" className="font-display mt-9 text-[clamp(2.5rem,5.4vw,4.5rem)] leading-[1] tracking-[-0.045em]">
              <span className="sr-only">{profile.name}: </span>
              <span className="rise-line" style={{ "--reveal-delay": "60ms" } as React.CSSProperties}>
                <span>I build data,</span>
              </span>
              <span className="rise-line" style={{ "--reveal-delay": "140ms" } as React.CSSProperties}>
                <span>AI and business</span>
              </span>
              <span className="rise-line" style={{ "--reveal-delay": "220ms" } as React.CSSProperties}>
                <span>
                  systems that <span className="text-primary">ship.</span>
                </span>
              </span>
            </h1>

            <p
              className="reveal text-muted-foreground mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.8rem]"
              style={{ "--reveal-delay": "300ms" } as React.CSSProperties}
            >
              {ROLES.map(({ label, icon: Icon }, i) => (
                <span key={label} className="text-foreground inline-flex items-center gap-1.5">
                  <Icon aria-hidden className="text-primary size-4" strokeWidth={1.75} />
                  {label}
                  {i < ROLES.length - 1 ? <span className="sr-only">,</span> : null}
                </span>
              ))}
            </p>
            <p
              className="reveal text-ink-soft mt-4 max-w-[52ch] text-[1.05rem] leading-[1.6] sm:text-[1.12rem]"
              style={{ "--reveal-delay": "360ms" } as React.CSSProperties}
            >
              Most recently clinical AI and data systems for a US radiology network. Before that, hotel, retail and civic
              data platforms for organisations across East Africa.
            </p>

            <div
              id="hero-actions"
              className="reveal mt-9 flex flex-wrap items-center gap-3"
              style={{ "--reveal-delay": "440ms" } as React.CSSProperties}
            >
              <Magnetic>
                <EmailLink placement="hero" className={buttonPrimary}>
                  <Mail aria-hidden className="size-4" strokeWidth={2} />
                  Email me
                </EmailLink>
              </Magnetic>
              <Magnetic>
                <a href={CV_PDF} download className={buttonSecondary} data-no-transition>
                  <Download aria-hidden className="size-4" strokeWidth={2} />
                  Download CV
                </a>
              </Magnetic>
              <a href="#work" className="group text-foreground inline-flex min-h-11 items-center gap-2 px-2 text-[0.92rem] font-medium">
                <span className="decoration-primary underline-offset-4 group-hover:underline">See the work</span>
                <ArrowDown aria-hidden className="text-primary size-4 transition-transform group-hover:translate-y-0.5" strokeWidth={2} />
              </a>
            </div>

            <dl
              className="reveal border-rule mt-11 grid max-w-[30rem] grid-cols-3 border-t pt-6"
              style={{ "--reveal-delay": "520ms" } as React.CSSProperties}
            >
              {glance.map(({ value, label }) => (
                <div key={label} className="flex flex-col-reverse">
                  <dt className="text-muted-foreground mt-2 font-mono text-[0.72rem]">{label}</dt>
                  <dd className="font-display text-foreground text-[2rem] leading-none tracking-[-0.03em] sm:text-[2.4rem]">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div id="terminal" className="reveal scroll-mt-24" style={{ "--reveal-delay": "250ms" } as React.CSSProperties}>
            <div data-parallax="-0.06" style={{ "--speed": -0.06 } as React.CSSProperties}>
              <script dangerouslySetInnerHTML={{ __html: TERM_INTRO_SCRIPT }} />
              <Terminal posts={termPosts} blogHref={crossHref("portfolio", "blog", "/")} />
              <p className="text-muted-foreground mt-3 text-center font-mono text-[0.72rem]">
                A real terminal. Try <span className="text-foreground">projects</span>, <span className="text-foreground">stack</span> or{" "}
                <span className="text-foreground">sudo</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Organisations, as text wordmarks */}
      <div className="border-rule border-y">
        <Wordmarks className="container-page py-9 sm:py-11" />
      </div>

      {/* By the numbers */}
      <section aria-labelledby="numbers-title" className="relative">
        <div className="container-page py-20 sm:py-28">
          <SectionHeading id="numbers-title" icon={ChartNoAxesCombined} kicker="By the numbers" title="Proof, counted.">
            <p className="text-ink-soft max-w-[40ch] text-[0.95rem] leading-relaxed sm:text-right">
              Shipped work, measured results and the people I have taught, each tied to the project behind it.
            </p>
          </SectionHeading>
          <NumbersBand items={figures} className="mt-12" />
        </div>
      </section>

      {/* Selected work */}
      <section id="work" aria-labelledby="work-title" className="scroll-mt-20">
        <div className="container-page pb-20 sm:pb-28">
          <SectionHeading id="work-title" icon={Sparkles} index="01" kicker="Selected work" title="Five systems, in detail.">
            <ArrowLink href="/work">All {work.length} projects</ArrowLink>
          </SectionHeading>
          <div className="mt-12 sm:mt-14">
            <FeaturedStack items={featured} />
          </div>
        </div>
      </section>

      {/* Technologies */}
      <div className="border-rule border-y py-7 sm:py-9">
        <TechMarquee />
      </div>

      {/* Work map */}
      <section aria-labelledby="map-title">
        <div className="container-page py-20 sm:py-28">
          <SectionHeading id="map-title" icon={Map} index="02" kicker="Work map" title={`All ${work.length} projects, mapped.`}>
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
            <SectionHeading id="experience-title" icon={BriefcaseBusiness} index="03" kicker="Experience" title="Where the work happened." />
            <p className="text-ink-soft mt-6 max-w-[44ch] leading-relaxed">
              Most recently, AI and data systems for a US radiology network. Before that, pipelines, models and stores for businesses in
              Kampala.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/cv" className={buttonPrimary}>
                Read the full CV
                <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
              </Link>
              <a href={CV_PDF} download className={buttonSecondary} data-no-transition>
                <Download aria-hidden className="size-4" strokeWidth={2} />
                PDF
                <span className="sr-only">, download the CV</span>
              </a>
            </div>
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
            <SectionHeading id="writing-title" icon={PenLine} index="04" kicker="Writing" title="Notes from the build.">
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
