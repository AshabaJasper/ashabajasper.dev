import Link from "next/link";
import {
  ArrowRight,
  Brain,
  ChartColumn,
  Cloud,
  Code,
  Database,
  Globe,
  Server,
  ShieldCheck,
  Workflow,
  Building2,
  CalendarRange,
  Check,
  GraduationCap,
  Layers,
  School,
  Sparkles,
  Star,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { KIND_ICON, sectorIcon } from "@/components/portfolio/icons";
import { TechChips, TechLogo, logoFor } from "@/components/portfolio/tech";
import { WorkImage } from "@/components/portfolio/work-image";
import { vtImage, vtTitle } from "@/components/portfolio/work-card";
import { CountUp } from "@/components/shared/count-up";
import { skillGroups } from "@/data/cv";
import { WORKED_WITH, type Highlight } from "@/data/highlights";
import { workKinds, type CaseStudy, type WorkItem } from "@/data/work";
import { cn } from "@/lib/utils";

/**
 * Server-rendered showcase blocks for the portfolio: the numbers band, the
 * organisations strip, the technology marquee and the pinned featured work.
 */

const HIGHLIGHT_ICON: Record<Highlight["icon"], LucideIcon> = {
  layers: Layers,
  building: Building2,
  calendar: CalendarRange,
  target: Target,
  users: Users,
  graduation: GraduationCap,
  school: School,
};

export function NumbersBand({ items, className }: { items: readonly Highlight[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7", className)}>
      {items.map((h, i) => {
        const Icon = HIGHLIGHT_ICON[h.icon];
        return (
          <div
            key={h.id}
            data-reveal
            style={{ "--i": i } as React.CSSProperties}
            className={cn(
              "stat-tile border-rule bg-card/80 group relative flex flex-col overflow-hidden rounded-[var(--radius-lg)] border p-4 backdrop-blur-sm sm:p-5",
              i === 0 && "col-span-2 md:col-span-2 lg:col-span-1",
            )}
          >
            <dd className="font-display text-[clamp(2rem,4.2vw,2.6rem)] leading-none">
              <span aria-hidden className="bg-accent text-primary mb-4 flex size-9 items-center justify-center rounded-[10px] transition-transform duration-300 group-hover:-rotate-6">
                <Icon className="size-[18px]" strokeWidth={1.75} />
              </span>
              <CountUp value={h.value} decimals={h.decimals} suffix={h.suffix} />
            </dd>
            <dt className="order-last mt-2">
              <span className="text-foreground block text-[0.9rem] leading-snug font-medium">{h.label}</span>
              <span className="text-muted-foreground mt-1 block font-mono text-[0.68rem] leading-snug">{h.source}</span>
            </dt>
          </div>
        );
      })}
    </dl>
  );
}

/** Organisations from the CV as typeset wordmarks: names, never their logos. */
export function Wordmarks({ className }: { className?: string }) {
  const styles = [
    "font-semibold tracking-[-0.03em]",
    "font-mono text-[0.92em] font-medium uppercase tracking-[0.06em]",
    "font-display italic tracking-[-0.02em]",
    "font-medium tracking-[0.01em]",
  ];
  return (
    <div className={className}>
      <p className="kicker text-center">Trusted with production work by</p>
      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-11">
        {WORKED_WITH.map((org, i) => (
          <li
            key={org.name}
            className={cn(
              "text-muted-foreground hover:text-foreground text-[1.05rem] whitespace-nowrap transition-colors duration-300 sm:text-[1.2rem]",
              styles[i % styles.length],
            )}
          >
            {org.name}
            {org.note ? <span className="text-muted-foreground/80 ml-1.5 font-sans text-[0.7em] font-normal tracking-normal not-italic normal-case">{org.note}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Every technology from the CV skills that has a published logo, as a slow strip. */
export function TechMarquee({ className }: { className?: string }) {
  const seen = new Set<string>();
  const names = skillGroups
    .flatMap((g) => g.items)
    .concat(["Next.js", "TypeScript", "Tailwind CSS", "NestJS", "Prisma", "Docker", "PHP", "WordPress"])
    .filter((name) => {
      if (seen.has(name) || !logoFor(name)) return false;
      seen.add(name);
      return true;
    });
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-3 pr-3">
      {names.map((name) => (
        <li
          key={name}
          className="border-rule bg-card/80 text-ink-soft hover:text-foreground inline-flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-[0.86rem] whitespace-nowrap transition-colors"
        >
          <TechLogo name={name} brand className="size-[18px]" />
          {name}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-labelledby="tech-title" className={cn("marquee overflow-hidden", className)}>
      <h2 id="tech-title" className="sr-only">
        Technologies I use
      </h2>
      <div className="[mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="marquee-track flex w-max">
          {row(false)}
          {row(true)}
        </div>
      </div>
    </section>
  );
}

/**
 * The five case studies as a pinned sequence: each card sticks under the
 * header and the next slides over it while the one beneath recedes. CSS
 * scroll timelines drive it where supported (globals.css); scroll-fx.tsx
 * drives the same look elsewhere. Short screens and reduced motion get a
 * plain list.
 */
export function FeaturedStack({ items }: { items: readonly (WorkItem & { caseStudy: CaseStudy })[] }) {
  const timelines = items.map((_, i) => `--wc-${i}`);
  return (
    <ol data-stack className="space-y-8 sm:space-y-10" style={{ timelineScope: timelines.join(", ") } as React.CSSProperties}>
      {items.map((item, i) => {
        const KindIcon = KIND_ICON[item.kind];
        const SectorIcon = sectorIcon(item.sector);
        const kind = workKinds.find((k) => k.kind === item.kind)?.label.replace(/s$/, "") ?? item.kind;
        return (
          <li key={item.slug} style={{ "--i": i, viewTimelineName: timelines[i] } as React.CSSProperties}>
            <article
              className="stack-card border-rule bg-card group has-[a:focus-visible]:outline-ring relative grid overflow-hidden rounded-[calc(var(--radius-xl)+6px)] border shadow-[0_30px_80px_-40px_rgb(0_0_0/0.45)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-solid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
              style={i < items.length - 1 ? ({ animationTimeline: timelines[i + 1] } as React.CSSProperties) : undefined}
            >
              <div className="relative p-2 sm:p-3 lg:p-3.5">
                <div className="overflow-hidden rounded-[var(--radius-xl)]" style={{ viewTransitionName: vtImage(item.slug) }}>
                  <div className="transition-transform duration-700 ease-[cubic-bezier(0.2,0.75,0.15,1)] group-hover:scale-[1.03] motion-reduce:transform-none">
                    <WorkImage
                      slug={item.slug}
                      name={item.name}
                      alt={item.screenshotAlt}
                      className="rounded-none border-0"
                      sizes="(min-width: 1200px) 620px, (min-width: 1024px) 54vw, calc(100vw - 52px)"
                      priority={i === 0}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col px-5 pt-3 pb-6 sm:px-7 sm:pb-8 lg:py-8 lg:pr-9 lg:pl-4">
                <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.72rem]">
                  <span className="text-primary text-[0.8rem] font-medium">{String(i + 1).padStart(2, "0")}</span>
                  <span className="border-rule inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                    <KindIcon aria-hidden className="size-3.5" strokeWidth={1.75} />
                    {kind}
                  </span>
                  <span className="border-rule inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
                    <SectorIcon aria-hidden className="size-3.5" strokeWidth={1.75} />
                    {item.sector}
                    {item.year !== null ? ` · ${item.year}` : ""}
                  </span>
                </p>
                <h3 className="font-display mt-4 w-fit text-[clamp(1.6rem,3vw,2.25rem)] leading-[1.02]" style={{ viewTransitionName: vtTitle(item.slug) }}>
                  <Link
                    href={`/work/${item.slug}`}
                    className="decoration-primary decoration-2 underline-offset-[6px] group-hover:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                  >
                    {item.name}
                  </Link>
                </h3>
                <p className="text-ink-soft mt-3 text-[1.02rem] leading-relaxed">{item.caseStudy.headline}</p>
                <ul className="mt-4 space-y-2 text-[0.92rem]">
                  {item.caseStudy.built.slice(0, 3).map((line) => (
                    <li key={line} className="text-ink-soft flex gap-2.5">
                      <Check aria-hidden className="text-primary mt-[0.2em] size-4 shrink-0" strokeWidth={2.25} />
                      {line}
                    </li>
                  ))}
                </ul>
                <TechChips stack={item.stack} className="mt-5" />
                <p className="text-foreground mt-6 inline-flex items-center gap-2 text-[0.9rem] font-medium lg:mt-auto lg:pt-6">
                  <Star aria-hidden className="text-primary size-4 fill-current" strokeWidth={1.75} />
                  Read the case study
                  <ArrowRight aria-hidden className="text-primary size-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2} />
                </p>
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}

const SKILL_ICON: Record<string, LucideIcon> = {
  languages: Code,
  ml: Brain,
  genai: Sparkles,
  data: Database,
  bi: ChartColumn,
  cloud: Cloud,
  mlops: Workflow,
  web: Globe,
  databases: Server,
  it: ShieldCheck,
};

/** The CV skills as cards of logo chips, one card per category. No levels, no bars. */
export function SkillGroups({ className, only }: { className?: string; only?: readonly string[] }) {
  const groups = only ? skillGroups.filter((g) => only.includes(g.id)) : skillGroups;
  return (
    <ul className={cn("grid gap-4 md:grid-cols-2", className)}>
      {groups.map((group, gi) => {
        const Icon = SKILL_ICON[group.id] ?? Code;
        return (
          <li
            key={group.id}
            data-reveal
            style={{ "--i": gi % 2 } as React.CSSProperties}
            className="border-rule bg-card/70 rounded-[var(--radius-lg)] border p-5 sm:p-6"
          >
            <h3 className="flex items-center gap-3">
              <span aria-hidden className="bg-accent text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]">
                <Icon className="size-[18px]" strokeWidth={1.75} />
              </span>
              <span className="font-semibold tracking-[-0.01em]">{group.label}</span>
              <span className="text-muted-foreground ml-auto font-mono text-[0.72rem]">
                {group.items.length} <span className="sr-only">skills</span>
              </span>
            </h3>
            <TechChips stack={group.items} label={group.label} className="mt-4" size="md" />
          </li>
        );
      })}
    </ul>
  );
}
