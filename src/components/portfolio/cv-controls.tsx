"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

/** Prints the CV page with its print stylesheet. */
export function PrintButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      <Printer aria-hidden className="size-4" strokeWidth={1.75} />
      Print
    </button>
  );
}

/**
 * The CV's section index. Sticky on wide screens; the section in view is
 * marked with aria-current so it reads the same to everyone.
 */
export function CvNav({ sections }: { sections: readonly { id: string; label: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="CV sections" className="print:hidden">
      <p className="kicker mb-3 hidden lg:block">On this page</p>
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {sections.map((s, i) => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-full px-3 font-mono text-[0.78rem] whitespace-nowrap transition-colors lg:rounded-[8px]",
                active === s.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className={cn("hidden lg:inline", active === s.id ? "text-primary" : "opacity-60")}>{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
