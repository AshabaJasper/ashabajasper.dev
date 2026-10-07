"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Split out of the main bundle and only fetched when motion is allowed.
const GenerativeGrid = dynamic(() => import("@/components/shared/generative-grid"), { ssr: false });

/**
 * The hero background. Everyone gets the static CSS dot grid; when motion is
 * allowed, the interactive canvas grid fades in over it once loaded.
 */
export function Backdrop({ className }: { className?: string }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAnimate(!media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden print:hidden", className)}>
      <div className={cn("dot-grid absolute inset-0 transition-opacity duration-700", animate && "opacity-0")} />
      {animate ? (
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_85%_75%_at_50%_40%,#000_35%,transparent_80%)]">
          <GenerativeGrid />
        </div>
      ) : null}
      <div className="absolute top-[-10%] right-[-10%] h-[70%] w-[60%] rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)]" />
    </div>
  );
}
