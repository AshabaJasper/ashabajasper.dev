"use client";

import { OPEN_PALETTE_EVENT, OPEN_SHORTCUTS_EVENT, useIsMac } from "@/components/shared/command-center";
import { cn } from "@/lib/utils";

/** "Press Ctrl K to jump anywhere, ? for shortcuts". Pointer devices only; on touch the header search does the job. */
export function KbdHint({ className }: { className?: string }) {
  const mac = useIsMac();
  return (
    <p className={cn("text-muted-foreground hidden flex-wrap items-center gap-x-1.5 gap-y-2 font-mono whitespace-nowrap text-[0.75rem] [@media(hover:hover)]:flex", className)}>
      Press
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))}
        className="hover:text-foreground inline-flex items-center gap-1 rounded-md"
      >
        <kbd className="kbd">{mac ? "⌘" : "Ctrl"}</kbd>
        <kbd className="kbd">K</kbd>
        <span className="sr-only">to open the command palette</span>
      </button>
      <span aria-hidden>to jump anywhere,</span>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event(OPEN_SHORTCUTS_EVENT))}
        className="hover:text-foreground inline-flex items-center gap-1 rounded-md"
      >
        <kbd className="kbd">?</kbd>
        <span aria-hidden>for shortcuts</span>
        <span className="sr-only">to show keyboard shortcuts</span>
      </button>
    </p>
  );
}
