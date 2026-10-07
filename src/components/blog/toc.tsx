"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/content/toc";
import { cn } from "@/lib/utils";

/**
 * The post's table of contents. On wide screens it sits in a sticky right
 * rail and marks the section being read (aria-current plus weight and a
 * dot, never colour alone). On smaller screens the same list lives inside
 * a collapsible <details> above the article.
 */

function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const headings = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    // The current section is the last heading above the reading line. A
    // scroll listener (throttled to one read per frame) also catches fast
    // jumps that an IntersectionObserver would skip.
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = 140;
      let current: string | null = null;
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line) current = heading.id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);

  return active;
}

function TocList({ items, active }: { items: TocItem[]; active: string | null }) {
  return (
    <ol className="toc-list">
      {items.map((item) => {
        const current = item.id === active;
        return (
          <li key={item.id} className={cn(item.depth === 3 && "toc-sub")}>
            <a
              href={`#${item.id}`}
              aria-current={current ? "location" : undefined}
              className={cn("toc-link", current && "toc-link-active")}
            >
              {item.text}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export function TocRail({ items }: { items: TocItem[] }) {
  const [ids] = useState(() => items.map((item) => item.id));
  const active = useActiveHeading(ids);
  if (items.length === 0) return null;
  return (
    <nav aria-labelledby="toc-rail-heading" className="toc-rail">
      <p id="toc-rail-heading" className="kicker">
        On this page
      </p>
      <TocList items={items} active={active} />
      <a href="#top" className="toc-top">
        Back to top
      </a>
    </nav>
  );
}

export function TocDisclosure({ items }: { items: TocItem[] }) {
  if (items.length === 0) return null;
  return (
    <details className="toc-details">
      <summary className="toc-summary">
        <span className="kicker">On this page</span>
        <span className="toc-summary-count">{items.length} sections</span>
      </summary>
      <nav aria-label="On this page">
        <TocList items={items} active={null} />
      </nav>
    </details>
  );
}
