"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Fine pointer and motion allowed: the only case where the effects below run. */
function motionAllowed(): boolean {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches && window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

/**
 * Pulls its child a few pixels toward the cursor while the cursor is near,
 * and springs back on leave. Transform only, on a wrapper, so layout and the
 * child's own focus ring are untouched. Off for touch and reduced motion.
 */
export function Magnetic({ children, strength = 0.28, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;
    let frame = 0;
    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) * strength;
      const y = (event.clientY - (rect.top + rect.height / 2)) * strength;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      el.style.transform = "";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  return (
    <span ref={ref} className={cn("inline-flex transition-transform duration-300 ease-out will-change-transform", className)}>
      {children}
    </span>
  );
}

const GLYPHS = "!<>-_\\/[]{}=+*^?#01";

/**
 * Text that decodes from random glyphs the first time it scrolls into view.
 * The real text is always in the DOM for assistive tech and search; the
 * animated copy is aria-hidden and only replaces it visually while running.
 */
export function Scramble({ text, className, duration = 900 }: { text: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    let frame = 0;
    let start = 0;
    const order = text.split("").map(() => Math.random() * 0.75);
    const tick = (now: number) => {
      if (!start) start = now;
      const progress = Math.min(1, (now - start) / duration);
      const out = text
        .split("")
        .map((ch, i) => (ch === " " || progress >= order[i] + 0.25 ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
        .join("");
      setDisplay(progress >= 1 ? null : out);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          frame = requestAnimationFrame(tick);
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [text, duration]);

  return (
    <span ref={ref} className={cn("relative inline-block", className)}>
      <span className={display === null ? undefined : "invisible"}>{text}</span>
      {display !== null ? (
        <span aria-hidden className="absolute inset-0">
          {display}
        </span>
      ) : null}
    </span>
  );
}
