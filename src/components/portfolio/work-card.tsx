import Link from "next/link";
import { WorkImage } from "@/components/portfolio/work-image";
import { StackLine } from "@/components/portfolio/ui";
import { sectorYear, type WorkItem } from "@/data/work";

/**
 * A featured project: screenshot, serif title, one-line summary, sector and
 * year in mono, stack as plain mono text. The title link stretches over the
 * whole card so the card is one target, without nesting interactive content.
 */
export function WorkCard({ item, priority = false }: { item: WorkItem; priority?: boolean }) {
  return (
    <article className="group has-[a:focus-visible]:outline-ring relative flex flex-col rounded-[14px] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-8 has-[a:focus-visible]:outline-solid">
      <div className="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 motion-reduce:transform-none">
        <WorkImage
          slug={item.slug}
          name={item.name}
          alt={item.screenshotAlt}
          sizes="(min-width: 1120px) 528px, (min-width: 768px) calc(50vw - 40px), calc(100vw - 32px)"
          priority={priority}
        />
      </div>
      <p className="text-muted-foreground mt-5 font-mono text-[0.78rem] tracking-wide tabular-nums">{sectorYear(item)}</p>
      <h3 className="mt-2 font-serif text-[1.65rem] leading-[1.1] tracking-[-0.01em] sm:text-[1.85rem]">
        <Link
          href={`/work/${item.slug}`}
          className="decoration-primary decoration-1 underline-offset-[6px] group-hover:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        >
          {item.name}
        </Link>
      </h3>
      <p className="text-ink-soft mt-2.5 max-w-[56ch] leading-relaxed">{item.summary}</p>
      <StackLine stack={item.stack} className="mt-3" />
    </article>
  );
}
