import Link from "next/link";
import { WorkImage } from "@/components/portfolio/work-image";
import { StackLine } from "@/components/portfolio/ui";
import { sectorYear, type CaseStudy, type WorkItem } from "@/data/work";
import { cn } from "@/lib/utils";

/** Names shared with the case study page, so the card morphs into it (see view-transitions.tsx). */
export const vtImage = (slug: string) => `work-image-${slug}`;
export const vtTitle = (slug: string) => `work-title-${slug}`;

/**
 * A featured project: screenshot, index, title, the case study headline,
 * sector and year, stack chips. The title link stretches over the whole card
 * so the card is one target, without nesting interactive content. Each card
 * rises in as it scrolls into view where the browser supports it.
 */
export function WorkCard({
  item,
  index,
  large = false,
  priority = false,
}: {
  item: WorkItem & { caseStudy: CaseStudy };
  index: number;
  large?: boolean;
  priority?: boolean;
}) {
  return (
    <article
      className={cn(
        "scroll-reveal group has-[a:focus-visible]:outline-ring relative flex flex-col rounded-[var(--radius-xl)] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-8 has-[a:focus-visible]:outline-solid",
        large && "md:col-span-2 lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-end lg:gap-12",
      )}
    >
      <div className="border-rule bg-card relative overflow-hidden rounded-[var(--radius-xl)] border p-2 sm:p-2.5">
        <div className="overflow-hidden rounded-[calc(var(--radius-xl)-6px)]" style={{ viewTransitionName: vtImage(item.slug) }}>
          <div className="transition-transform duration-700 ease-[cubic-bezier(0.2,0.75,0.15,1)] group-hover:scale-[1.025] motion-reduce:transform-none">
            <WorkImage
              slug={item.slug}
              name={item.name}
              alt={item.screenshotAlt}
              className="rounded-none border-0"
              sizes={
                large
                  ? "(min-width: 1200px) 680px, (min-width: 1024px) 60vw, calc(100vw - 52px)"
                  : "(min-width: 1200px) 560px, (min-width: 768px) calc(50vw - 48px), calc(100vw - 52px)"
              }
              priority={priority}
            />
          </div>
        </div>
      </div>
      <div className={cn("mt-6 px-1", large && "lg:mt-0 lg:pb-4")}>
        <p className="text-muted-foreground flex items-center gap-3 font-mono text-[0.75rem] tabular-nums">
          <span className="text-primary">{String(index + 1).padStart(2, "0")}</span>
          <span aria-hidden className="bg-rule h-px w-6" />
          {sectorYear(item)}
        </p>
        <h3
          className={cn("font-display mt-3 w-fit leading-[1.02]", large ? "text-[clamp(1.9rem,3.6vw,2.9rem)]" : "text-[clamp(1.6rem,2.6vw,2.05rem)]")}
          style={{ viewTransitionName: vtTitle(item.slug) }}
        >
          <Link
            href={`/work/${item.slug}`}
            className="decoration-primary decoration-2 underline-offset-[6px] group-hover:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {item.name}
          </Link>
        </h3>
        <p className="text-ink-soft mt-3 max-w-[52ch] text-[1.02rem] leading-relaxed">{item.caseStudy.headline}</p>
        <StackLine stack={item.stack} className="mt-4" />
        <p className="text-foreground mt-5 inline-flex items-center gap-2 font-mono text-[0.78rem]">
          Read the case study
          <span aria-hidden className="text-primary transition-transform duration-200 group-hover:translate-x-1">
            &rarr;
          </span>
        </p>
      </div>
    </article>
  );
}
