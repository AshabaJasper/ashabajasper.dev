import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, LayoutGrid, PenLine } from "lucide-react";
import { Backdrop } from "@/components/shared/backdrop";
import { profile } from "@/data/profile";
import { work } from "@/data/work";
import { crossHref } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    site: "portfolio",
    path: "/contact/thanks",
    title: "Message sent",
    description: "Your message to Ashaba Jasper has arrived. Here is what happens next, and where to go from here.",
  }),
  robots: { index: false, follow: true },
};

const CONFETTI = ["var(--viz-system)", "var(--viz-ecommerce)", "var(--viz-mobile)", "var(--primary)"];

/** Reached after a successful send. Visiting it directly is harmless: it carries no data. */
export default function ContactThanksPage() {
  const next = [
    {
      title: "See the work",
      text: `${work.length} projects, five of them as in-depth case studies.`,
      href: "/work",
      icon: LayoutGrid,
      external: false,
    },
    {
      title: "Read the writing",
      text: "How the systems I build actually work.",
      href: crossHref("portfolio", "blog", "/"),
      icon: PenLine,
      external: true,
    },
    {
      title: "Download the CV",
      text: "Experience, projects and skills, as a PDF.",
      href: "/cv/Ashaba-Joshua-Jasper-CV-2026.pdf",
      icon: Download,
      external: false,
      download: true,
    },
  ];

  return (
    <section aria-labelledby="thanks-title" className="relative isolate overflow-hidden">
      <Backdrop className="-z-10" />
      {/* A short, one-time burst of colour. Decorative, and absent under reduced motion. */}
      <div aria-hidden className="confetti pointer-events-none absolute inset-x-0 top-0 -z-10 h-full">
        {Array.from({ length: 22 }, (_, i) => (
          <span
            key={i}
            className="absolute top-0 block rounded-[2px]"
            style={
              {
                left: `${(i * 37) % 100}%`,
                width: i % 3 === 0 ? 6 : 8,
                height: i % 3 === 0 ? 12 : 8,
                background: CONFETTI[i % CONFETTI.length],
                "--dx": `${((i * 53) % 120) - 60}px`,
                "--rot": `${360 + ((i * 97) % 540)}deg`,
                animation: `confetti-fall ${2.2 + (i % 5) * 0.25}s cubic-bezier(0.2, 0.6, 0.3, 1) ${(i % 7) * 0.08}s both`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="container-page flex min-h-[70vh] flex-col justify-center py-16 sm:py-24">
        <div className="relative size-20 sm:size-24">
          <span aria-hidden className="bg-primary/25 absolute inset-0 rounded-full" style={{ animation: "pulse-ring 1.6s ease-out 0.5s 2 both" }} />
          <svg viewBox="0 0 96 96" className="relative size-full" aria-hidden>
            <circle cx="48" cy="48" r="44" fill="var(--accent)" stroke="var(--primary)" strokeWidth="3" />
            <path
              d="M30 49 L43 62 L67 36"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1 1"
              style={{ animation: "check-draw 700ms cubic-bezier(0.65, 0, 0.35, 1) 250ms both" }}
            />
          </svg>
        </div>
        <p className="kicker reveal mt-8">Message sent</p>
        <h1 id="thanks-title" className="font-display reveal mt-4 max-w-[16ch] text-[clamp(2.6rem,7vw,5rem)] leading-[0.95]" style={{ "--reveal-delay": "100ms" } as React.CSSProperties}>
          Thank you. Your message is with me.
        </h1>
        <div className="text-ink-soft reveal mt-6 max-w-[56ch] space-y-4 text-[1.06rem] leading-relaxed sm:text-lg" style={{ "--reveal-delay": "200ms" } as React.CSSProperties}>
          <p>I read every message and reply personally, from my own email address.</p>
          <p>
            If something is urgent or you forgot a detail, write to{" "}
            <a href={`mailto:${profile.email}`} className="link">
              {profile.email}
            </a>
            .
          </p>
        </div>

        <h2 className="kicker reveal mt-12" style={{ "--reveal-delay": "280ms" } as React.CSSProperties}>
          While you wait
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {next.map((item, i) => {
            const body = (
              <>
                <span aria-hidden className="bg-accent text-primary inline-flex size-11 items-center justify-center rounded-[12px]">
                  <item.icon className="size-5" strokeWidth={1.75} />
                </span>
                <span className="mt-4 flex items-center gap-2 text-[1.08rem] font-semibold tracking-[-0.01em]">
                  {item.title}
                  <ArrowRight aria-hidden className="text-primary size-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
                </span>
                <span className="text-muted-foreground mt-1.5 block text-[0.92rem] leading-relaxed">{item.text}</span>
              </>
            );
            const className =
              "group border-rule bg-card/80 hover:border-foreground/25 flex h-full flex-col rounded-[var(--radius-lg)] border p-5 transition-[border-color,transform] duration-300 hover:-translate-y-0.5";
            return (
              <li key={item.title} className="reveal" style={{ "--reveal-delay": `${340 + i * 80}ms` } as React.CSSProperties}>
                {item.download ? (
                  <a href={item.href} download data-no-transition className={className}>
                    {body}
                  </a>
                ) : item.external ? (
                  <a href={item.href} className={className}>
                    {body}
                  </a>
                ) : (
                  <Link href={item.href} className={className}>
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
