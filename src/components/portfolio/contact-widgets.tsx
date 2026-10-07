"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { profile } from "@/data/profile";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/** Copies the email address and says so, visibly and to screen readers. */
export function CopyEmailButton({ className }: { className?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2400);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(profile.email);
      setState("copied");
      track("email-click", { placement: "contact-copy" });
    } catch {
      setState("failed");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={state === "copied" ? "Email address copied" : "Copy email address"}
        className={cn(
          "border-rule bg-background/70 hover:border-foreground/30 relative z-10 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-3.5 text-[0.84rem] font-medium transition-[color,background-color,border-color,transform] active:scale-95",
          state === "copied" ? "border-primary text-primary" : "text-foreground",
          className,
        )}
      >
        {state === "copied" ? <Check aria-hidden className="size-4" strokeWidth={2.5} /> : <Copy aria-hidden className="size-4" strokeWidth={1.9} />}
        <span aria-hidden>{state === "copied" ? "Copied" : "Copy"}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Email address copied to the clipboard" : state === "failed" ? `Copy did not work. The address is ${profile.email}` : ""}
      </span>
    </>
  );
}

const ZONE = "Africa/Kampala";

function partsIn(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { hour: Number(get("hour")), hh: get("hour"), mm: get("minute"), ss: get("second") };
}

/** Kampala sits near the equator, so sunrise and sunset stay close to 7am and 7pm all year. */
function phase(hour: number): { label: string; icon: typeof Sun } {
  if (hour >= 6 && hour < 8) return { label: "Early morning in Kampala", icon: Sunrise };
  if (hour >= 8 && hour < 18) return { label: "Daytime in Kampala", icon: Sun };
  if (hour >= 18 && hour < 20) return { label: "Evening in Kampala", icon: Sunset };
  return { label: "Night-time in Kampala", icon: Moon };
}

/** A live clock for Kampala (East Africa Time, UTC+3). Rendered after mount so server and client agree. */
export function KampalaClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const p = now ? partsIn(now) : null;
  const ph = p ? phase(p.hour) : null;
  const Icon = ph?.icon ?? Sun;
  const day = p ? p.hour >= 6 && p.hour < 19 : true;

  return (
    <div className="border-rule bg-card/80 relative overflow-hidden rounded-[var(--radius-xl)] border p-5 sm:p-6">
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-2xl transition-colors duration-1000",
          day ? "bg-amber-300/25" : "bg-indigo-400/20",
        )}
      />
      <p className="kicker relative">Local time</p>
      <div className="relative mt-3 flex items-end justify-between gap-4">
        <p className="font-display text-[clamp(2.4rem,6vw,3.2rem)] leading-none tabular-nums">
          {p ? (
            <>
              <time dateTime={now!.toISOString()}>
                {p.hh}
                <span className="clock-colon">:</span>
                {p.mm}
              </time>
              <span aria-hidden className="text-muted-foreground ml-1.5 font-mono text-[0.9rem] tracking-normal">
                {p.ss}
              </span>
            </>
          ) : (
            <span aria-hidden className="invisible">
              00:00
            </span>
          )}
        </p>
        <span
          aria-hidden
          className={cn(
            "inline-flex size-12 shrink-0 items-center justify-center rounded-full",
            day ? "bg-amber-400/15 text-amber-600 dark:text-amber-300" : "bg-indigo-400/15 text-indigo-600 dark:text-indigo-300",
          )}
        >
          <Icon className="size-6" strokeWidth={1.75} />
        </span>
      </div>
      <p className="text-ink-soft relative mt-3 text-[0.92rem]">
        {ph ? ph.label : "Kampala, Uganda"}
        <span className="text-muted-foreground"> · East Africa Time, UTC+3</span>
      </p>
    </div>
  );
}
