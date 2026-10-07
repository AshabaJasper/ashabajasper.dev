"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Split out of the main bundle and only fetched when motion is allowed.
const GenerativeGrid = dynamic(() => import("@/components/shared/generative-grid"), { ssr: false });

function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAllowed(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return allowed;
}

/**
 * The site-wide background, fixed behind every page on every host. Everyone
 * gets the static CSS dot grid; when motion is allowed, the interactive
 * canvas grid fades in over it once loaded. Mounted once in the root layout.
 */
export function SiteBackdrop() {
  const animate = useMotionAllowed();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden print:hidden">
      <div className={cn("dot-grid-full absolute inset-0 transition-opacity duration-700", animate && "opacity-0")} />
      {animate ? (
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_120%_100%_at_50%_30%,#000_45%,transparent_100%)]">
          <GenerativeGrid />
        </div>
      ) : null}
    </div>
  );
}

/** A soft accent glow behind hero areas. The grid itself comes from SiteBackdrop. */
export function Backdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden print:hidden", className)}>
      <div className="absolute top-[-10%] right-[-10%] h-[70%] w-[60%] rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)]" />
    </div>
  );
}
