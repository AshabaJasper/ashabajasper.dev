"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

let pending: (() => void) | null = null;

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Smooth page transitions with the View Transitions API. Same-host link
 * clicks are wrapped in document.startViewTransition, so the page cross-fades
 * and elements that share a view-transition-name (a work card's screenshot
 * and title, and the case study's) morph into each other. Browsers without
 * the API, modified clicks, new tabs, downloads, hash jumps on the same page
 * and reduced motion all fall through to normal navigation.
 */
export function ViewTransitions() {
  const router = useRouter();
  const pathname = usePathname();

  // The new route has committed: let the transition capture it.
  useEffect(() => {
    if (!pending) return;
    const resolve = pending;
    pending = null;
    // Not requestAnimationFrame: rendering, and with it rAF, is paused until this promise settles.
    resolve();
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!("startViewTransition" in document) || reducedMotion()) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download") || anchor.dataset.noTransition !== undefined) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (hash jumps, filters on the same path): no transition, or it would wait for a route change that never comes.
      if (url.pathname === window.location.pathname) return;

      event.preventDefault();
      const href = `${url.pathname}${url.search}${url.hash}`;
      document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            pending = resolve;
            // Never hold the old snapshot for long, even if the route is slow.
            window.setTimeout(() => {
              if (pending === resolve) {
                pending = null;
                resolve();
              }
            }, 1500);
            router.push(href);
          }),
      );
    };
    // Capture phase, so this runs before next/link's own click handler.
    window.addEventListener("click", onClick, true);
    return () => window.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
