import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small server-rendered building blocks shared by the portfolio pages:
 * section headings, buttons, the mono stack line and page headers.
 */

export const buttonPrimary =
  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-[0.94rem] font-medium transition-colors";

export const buttonSecondary =
  "border-rule text-foreground hover:border-foreground/30 hover:bg-muted inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-6 text-[0.94rem] font-medium transition-colors";

export function SectionHeading({
  id,
  kicker,
  title,
  className,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-4 self-start sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <p className="kicker">{kicker}</p>
        <h2 id={id} className="mt-3 font-serif text-[2rem] leading-[1.05] tracking-[-0.015em] sm:text-[2.5rem]">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

/** Next.js · NestJS · TypeScript, in mono. Renders nothing for an empty stack. */
export function StackLine({ stack, className }: { stack: readonly string[]; className?: string }) {
  if (stack.length === 0) return null;
  return (
    <p className={cn("text-muted-foreground font-mono text-[0.78rem] leading-relaxed", className)}>
      <span className="sr-only">Built with </span>
      {/* A no-break space keeps each middot with the item before it, so no line starts or ends on a lone dot. */}
      {stack.join(" · ")}
    </p>
  );
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
    <header className="container-page pt-14 pb-10 sm:pt-20 sm:pb-14">
      <p className="kicker">{kicker}</p>
      <h1 className="mt-4 max-w-[18ch] font-serif text-[2.75rem] leading-[1] tracking-[-0.02em] sm:text-[4rem]">{title}</h1>
      {lede ? <div className="text-ink-soft mt-6 max-w-[60ch] text-[1.06rem] leading-relaxed sm:text-lg">{lede}</div> : null}
      {children}
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
      className={cn(
        "group text-foreground inline-flex min-h-11 items-center gap-1.5 text-[0.95rem] font-medium",
        className,
      )}
    >
      <span className="decoration-primary/60 underline-offset-4 group-hover:underline">{children}</span>
      <span aria-hidden className="text-primary transition-transform duration-200 group-hover:translate-x-0.5">
        &rarr;
      </span>
    </Link>
  );
}
