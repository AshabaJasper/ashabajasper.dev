import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { TechChips } from "@/components/portfolio/tech";
import { Backdrop } from "@/components/shared/backdrop";
import { Scramble } from "@/components/shared/motion";
import { cn } from "@/lib/utils";

/**
 * Small server-rendered building blocks shared by the portfolio pages:
 * section headings, buttons, the mono stack line and page headers.
 */

export const buttonPrimary =
  "bg-foreground text-background hover:bg-primary hover:text-primary-foreground inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-[0.92rem] font-medium transition-colors duration-200";

export const buttonSecondary =
  "border-rule bg-card/50 text-foreground hover:border-foreground/30 hover:bg-muted inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-6 text-[0.92rem] font-medium transition-colors duration-200";

export function SectionHeading({
  id,
  kicker,
  title,
  index,
  icon: Icon,
  className,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  /** "01", "02": a quiet section counter in front of the kicker. */
  index?: string;
  /** A lucide icon shown in a small tile beside the kicker. */
  icon?: LucideIcon;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-5 self-start sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <p className="kicker flex items-center gap-3">
          {Icon ? (
            <span aria-hidden className="bg-accent text-primary inline-flex size-8 items-center justify-center rounded-[9px]">
              <Icon className="size-4" strokeWidth={1.9} />
            </span>
          ) : null}
          {index ? <span className="text-primary">{index}</span> : null}
          <span aria-hidden className="bg-rule h-px w-8" />
          {kicker}
        </p>
        <h2 id={id} className="font-display mt-4 max-w-[22ch] text-[clamp(2rem,4.6vw,3.4rem)] leading-[1]">
          <Scramble text={title} />
        </h2>
      </div>
      {children}
    </div>
  );
}

/** A stack as logo chips. Renders nothing for an empty stack. */
export function StackLine({ stack, className }: { stack: readonly string[]; className?: string }) {
  return <TechChips stack={stack} className={className} />;
}

export function PageHeader({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden">
      <Backdrop className="-z-10" />
      <div className="container-page pt-14 pb-12 sm:pt-24 sm:pb-16">
        <p className="kicker kicker-prompt reveal">{kicker.toLowerCase()}</p>
        <h1
          className="font-display reveal mt-5 max-w-[16ch] text-[clamp(2.6rem,7.5vw,5.5rem)] leading-[0.95]"
          style={{ "--reveal-delay": "80ms" } as React.CSSProperties}
        >
          {title}
        </h1>
        {lede ? (
          <div
            className="text-ink-soft reveal mt-6 max-w-[60ch] text-[1.06rem] leading-relaxed sm:text-lg"
            style={{ "--reveal-delay": "160ms" } as React.CSSProperties}
          >
            {lede}
          </div>
        ) : null}
        {children}
      </div>
    </header>
  );
}

/** A link that opens another site in a new tab and says so to screen readers. */
export function ExternalLink({
  href,
  className,
  children,
  icon = true,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  icon?: boolean;
}) {
  return (
    <a href={href} target="_blank" rel="noopener" className={className}>
      {children}
      {icon ? <ArrowUpRight aria-hidden className="ml-0.5 inline size-[0.9em] align-[-0.05em]" strokeWidth={1.75} /> : null}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** A plain internal text link with an arrow, used for "All projects" and similar. */
export function ArrowLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("group text-foreground inline-flex min-h-11 items-center gap-2 font-mono text-[0.82rem]", className)}
    >
      <span className="decoration-primary underline-offset-4 group-hover:underline">{children}</span>
      <span aria-hidden className="text-primary transition-transform duration-200 group-hover:translate-x-1">
        &rarr;
      </span>
    </Link>
  );
}
