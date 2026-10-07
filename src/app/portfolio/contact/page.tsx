import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BrainCircuit, ChartColumn, Code, Database, FileText, Mail, MessageSquareText, ShoppingCart, Smartphone, Sparkles, Workflow } from "lucide-react";
import { ContactForm } from "@/components/portfolio/contact-form";
import { CopyEmailButton, KampalaClock } from "@/components/portfolio/contact-widgets";
import { EmailLink } from "@/components/portfolio/email-link";
import { TechLogo } from "@/components/portfolio/tech";
import { Backdrop } from "@/components/shared/backdrop";
import { profile } from "@/data/profile";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  site: "portfolio",
  path: "/contact",
  title: "Contact",
  description:
    "Contact Ashaba Jasper about a data, AI or software project: email ashabajasper@gmail.com or send a message through the form. Based in Kampala, Uganda.",
});


/** Drawn from the CV's core competencies and the kinds of work in the portfolio. */
const HELP_WITH = [
  { label: "Data pipelines and ETL", icon: Workflow },
  { label: "Machine learning models", icon: BrainCircuit },
  { label: "LLM and generative AI systems", icon: Sparkles },
  { label: "Dashboards and BI", icon: ChartColumn },
  { label: "Full-stack web applications", icon: Code },
  { label: "Business systems and databases", icon: Database },
  { label: "Online stores", icon: ShoppingCart },
  { label: "Mobile apps", icon: Smartphone },
];

const PROFILES = [
  { label: "LinkedIn", detail: "Career and roles", href: profile.links.linkedin, logo: null },
  { label: "GitHub", detail: "Code in the open", href: profile.links.github, logo: "github" },
  { label: "X", detail: profile.xHandle, href: profile.links.x, logo: "x" },
] as const;

const card =
  "border-rule bg-card/80 hover:border-foreground/25 group relative flex min-h-16 items-center gap-4 rounded-[var(--radius-lg)] border p-4 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_rgb(0_0_0/0.4)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-[var(--ring)]";

const iconBox = "bg-accent text-primary inline-flex size-11 shrink-0 items-center justify-center rounded-[12px]";

export default function ContactPage() {
  return (
    <div className="relative isolate">
      <Backdrop className="-z-10" />
      <div className="container-page grid gap-12 pt-12 pb-8 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-16">
        <div className="min-w-0">
          <p className="kicker kicker-prompt reveal">contact</p>
          <h1 className="font-display reveal mt-5 max-w-[14ch] text-[clamp(2.6rem,7vw,5rem)] leading-[0.95]" style={{ "--reveal-delay": "80ms" } as React.CSSProperties}>
            Let&rsquo;s build something that <span className="text-primary">works</span>.
          </h1>
          <p className="text-ink-soft reveal mt-6 max-w-[48ch] text-[1.06rem] leading-relaxed sm:text-lg" style={{ "--reveal-delay": "160ms" } as React.CSSProperties}>
            Hiring for data, AI or full-stack work, or planning a system of your own? A few lines about the problem and who it is for
            is a great start. I read every message and reply personally.
          </p>

          {/* id="hero-actions": the sticky mobile bar waits until these scroll out of view. */}
          <ul id="hero-actions" className="mt-9 grid grid-cols-[minmax(0,1fr)] gap-3" aria-label="Ways to reach me">
            <li data-reveal style={{ "--i": 0 } as React.CSSProperties} className={card}>
              <span aria-hidden className={iconBox}>
                <Mail className="size-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-[0.8rem]">Email, the quickest way</span>
                <EmailLink
                  placement="contact-page"
                  className="text-foreground block truncate font-mono text-[0.95rem] font-medium after:absolute after:inset-0 after:content-[''] focus-visible:outline-none sm:text-[1.02rem]"
                />
              </span>
              <CopyEmailButton />
            </li>
            <li data-reveal style={{ "--i": 1 } as React.CSSProperties} className={card}>
              <span aria-hidden className={iconBox}>
                <FileText className="size-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-muted-foreground block text-[0.8rem]">Experience, projects, skills</span>
                <Link href="/cv" className="text-foreground block font-medium after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
                  Read my CV
                </Link>
              </span>
              <ArrowUpRight aria-hidden className="text-muted-foreground group-hover:text-primary size-5 shrink-0 transition-colors" strokeWidth={1.75} />
            </li>
            <li className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-3">
              {PROFILES.map((p, i) => (
                <div key={p.label} data-reveal style={{ "--i": i + 2 } as React.CSSProperties} className={`${card} sm:flex-col sm:items-start sm:gap-3`}>
                  <span aria-hidden className="bg-foreground text-background inline-flex size-10 shrink-0 items-center justify-center rounded-[11px]">
                    {p.logo ? <TechLogo name={p.logo} className="size-[18px]" /> : <span className="text-[0.95rem] font-bold">in</span>}
                  </span>
                  <span className="min-w-0">
                    <a
                      href={p.href}
                      target="_blank"
                      rel="me noopener"
                      className="text-foreground block font-medium after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                    >
                      {p.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <span className="text-muted-foreground block truncate font-mono text-[0.72rem]">{p.detail}</span>
                  </span>
                </div>
              ))}
            </li>
          </ul>

          <div className="mt-8">
            <KampalaClock />
          </div>

          <section aria-labelledby="help-title" className="mt-10">
            <h2 id="help-title" className="kicker flex items-center gap-2.5">
              <MessageSquareText aria-hidden className="text-primary size-4" strokeWidth={1.9} />
              What I can help with
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {HELP_WITH.map(({ label, icon: Icon }, i) => (
                <li
                  key={label}
                  className="chip-pop border-rule bg-card/70 text-ink-soft inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 text-[0.86rem]"
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <Icon aria-hidden className="text-primary size-4" strokeWidth={1.75} />
                  {label}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section id="contact-form-section" aria-labelledby="form-title" className="min-w-0 scroll-mt-24 lg:pt-4">
          <div className="border-rule bg-card relative overflow-hidden rounded-[calc(var(--radius-xl)+6px)] border p-5 shadow-[0_40px_100px_-50px_rgb(0_0_0/0.45)] sm:p-8 lg:sticky lg:top-24">
            <div aria-hidden className="bg-primary/10 pointer-events-none absolute -top-24 -right-24 size-56 rounded-full blur-3xl" />
            <div className="relative flex items-center gap-3">
              <span aria-hidden className={iconBox}>
                <MessageSquareText className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <h2 id="form-title" className="font-display text-[1.7rem] leading-tight sm:text-[2rem]">
                  Send a message
                </h2>
                <p className="text-muted-foreground text-[0.88rem]">All fields are required unless marked optional.</p>
              </div>
            </div>
            <div className="relative mt-7">
              <ContactForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
