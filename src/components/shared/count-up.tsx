"use client";

import { useEffect, useRef, useState } from "react";

function format(value: number, decimals: number): string {
  return value.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * A number that counts up from zero the first time it scrolls into view. The
 * final value is in the server HTML and is what assistive technology reads;
 * the counting copy is visual only. Numbers already on screen at load, and
 * every number under reduced motion, simply stay at their final value.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1400,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;
    setShown(0);
    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let start = 0;
        const tick = (now: number) => {
          if (!start) start = now;
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(t >= 1 ? null : value * eased);
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  const final = `${prefix}${format(value, decimals)}${suffix}`;
  return (
    <span ref={ref} className="relative inline-block tabular-nums">
      {shown === null ? (
        final
      ) : (
        <>
          <span className="sr-only">{final}</span>
          <span aria-hidden className="invisible">
            {final}
          </span>
          <span aria-hidden className="absolute inset-0">
            {prefix}
            {format(shown, decimals)}
            {suffix}
          </span>
        </>
      )}
    </span>
  );
}
