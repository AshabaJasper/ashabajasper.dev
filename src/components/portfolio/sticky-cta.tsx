"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { profile } from "@/data/profile";
import { track } from "@/lib/analytics";
import { publicPath } from "@/lib/links";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "ajd-sticky-cta-dismissed";
const PHONE_QUERY = "(max-width: 767.98px)";

/** The conversion pages that get the bar. Never thanks, legal or 404 pages. */
function wantsBar(path: string): boolean {
  return path === "/" || path === "/work" || path === "/cv" || path === "/contact" || /^\/work\/[a-z0-9-]+$/.test(path);
}

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Storage blocked: the bar stays dismissed until the next page load.
  }
}

function isTextField(el: Element | null): boolean {
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT");
}

/**
 * The sticky mobile call to action. Under 768px only. It steps aside while a
 * form field has focus (so it never sits on the keyboard), while the footer
 * or the contact form is on screen, and once dismissed for the session.
 * While it can show, the page gets matching bottom padding so it never
 * covers the last of the content.
 */
export function StickyCta() {
  const path = publicPath(usePathname() ?? "/");
  const enabled = wantsBar(path);
  const onContact = path === "/contact";

  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [typing, setTyping] = useState(false);
  // Starts covered so the bar never flashes before the observer has looked.
  const [covered, setCovered] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDismissed(readDismissed());
    setMounted(true);
  }, []);

  // Hide while any field has focus.
  useEffect(() => {
    if (!enabled) return;
    const update = () => setTyping(isTextField(document.activeElement));
    // On focusout the next element is not focused yet; check once it is.
    const later = () => window.setTimeout(update, 0);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", later);
    update();
    return () => {
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", later);
    };
  }, [enabled]);

  // Hide while the footer, the contact form or the hero actions are in view.
  useEffect(() => {
    if (!enabled) return;
    if (typeof IntersectionObserver === "undefined") {
      setCovered(false);
      return;
    }
    const targets = [
      document.querySelector("footer"),
      document.getElementById("contact-form-section"),
      // The home hero and each case study header carry their own actions; the bar waits until they scroll away.
      document.getElementById("hero-actions"),
    ].filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0) {
      setCovered(false);
      return;
    }
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setCovered(visible.size > 0);
    });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled, path]);

  const active = enabled && mounted && !dismissed;
  const shown = active && !typing && !covered;

  // Reserve room at the bottom of the page on phones while the bar is in play.
  useEffect(() => {
    if (!active) return;
    const media = window.matchMedia(PHONE_QUERY);
    const apply = () => {
      const height = barRef.current?.offsetHeight ?? 0;
      document.body.style.paddingBottom = media.matches && height ? `${height}px` : "";
    };
    apply();
    media.addEventListener("change", apply);
    window.addEventListener("resize", apply);
    return () => {
      media.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
      document.body.style.paddingBottom = "";
    };
  }, [active]);

  if (!active) return null;

  const dismiss = () => {
    writeDismissed();
    setDismissed(true);
  };

  return (
    <div
      ref={barRef}
      role="region"
      aria-label="Get in touch"
      aria-hidden={shown ? undefined : true}
      inert={!shown}
      className={cn(
        "border-rule bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md transition-[transform,opacity] duration-200 md:hidden",
        shown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5">
        <a
          href={`mailto:${profile.email}`}
          onClick={() => track("email-click", { placement: "sticky-bar" })}
          className="bg-primary text-primary-foreground inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-[0.94rem] font-medium"
        >
          Email me
        </a>
        {onContact ? null : (
          <Link
            href="/contact"
            onClick={() => track("cta-click", { placement: "sticky-bar" })}
            className="border-rule text-foreground inline-flex min-h-11 flex-1 items-center justify-center rounded-full border px-4 text-[0.94rem] font-medium"
          >
            Contact form
          </Link>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide this bar"
          className="text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-11 shrink-0 items-center justify-center rounded-full"
        >
          <X aria-hidden className="size-[18px]" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
