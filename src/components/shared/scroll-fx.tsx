"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const REVEAL = "[data-reveal], .scroll-reveal, .diagram, [data-stack]";

function supportsScrollTimelines(): boolean {
  return typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()") && CSS.supports("animation-timeline: scroll()");
}

/**
 * Scroll effects for the portfolio, progressive and motion-safe:
 *
 * - a reading progress bar under the header,
 * - parallax on hero layers marked `data-parallax="0.2"`,
 * - reveals for `data-reveal`, `.scroll-reveal` and diagrams,
 * - the pinned "selected work" sequence (`data-stack`).
 *
 * Where the browser has scroll-driven animations, CSS does all of it
 * (globals.css) and this component only marks <html> as ready. Elsewhere it
 * falls back to one passive scroll listener (transforms only, one write per
 * frame) and IntersectionObservers. Under reduced motion nothing moves and
 * nothing is hidden.
 */
export function ScrollFx() {
  const barRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const native = supportsScrollTimelines();
    root.classList.toggle("sda", native);
    if (native) {
      root.classList.add("fx");
      return;
    }

    // Anything already on screen counts as revealed before the hidden state applies, so nothing flickers.
    const targets = [...document.querySelectorAll<HTMLElement>(REVEAL)];
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) el.classList.add("in-view");
    }
    root.classList.add("fx");

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            reveal.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    targets.filter((el) => !el.classList.contains("in-view")).forEach((el) => reveal.observe(el));

    // Pinned work cards: each card shrinks and dims as the next one slides over it.
    const stackItems = [...document.querySelectorAll<HTMLElement>("[data-stack] > li")];
    const thresholds = Array.from({ length: 26 }, (_, i) => i / 25);
    const stack = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = stackItems.indexOf(entry.target as HTMLElement);
          const previous = stackItems[index - 1]?.firstElementChild as HTMLElement | null | undefined;
          previous?.style.setProperty("--p", entry.intersectionRatio.toFixed(3));
        }
      },
      { threshold: thresholds },
    );
    stackItems.slice(1).forEach((el) => stack.observe(el));

    // Progress bar and parallax: one rAF-throttled passive listener.
    const layers = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (y < window.innerHeight * 1.5) {
        for (const el of layers) {
          const speed = Number(el.dataset.parallax) || 0;
          el.style.transform = `translate3d(0, ${(y * speed).toFixed(1)}px, 0)`;
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      reveal.disconnect();
      stack.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return (
    <div aria-hidden className="scroll-progress-track pointer-events-none fixed inset-x-0 top-16 z-40 h-[2px] print:hidden">
      <div ref={barRef} className="scroll-progress bg-primary h-full origin-left" style={{ transform: "scaleX(0)" }} />
    </div>
  );
}
