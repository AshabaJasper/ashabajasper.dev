"use client";

import { OPEN_SHORTCUTS_EVENT } from "@/components/shared/command-center";

/** Opens the keyboard shortcuts dialog. Hidden on touch-only screens, where shortcuts mean nothing. */
export function ShortcutsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SHORTCUTS_EVENT))}
      className="hover:text-foreground hidden min-h-9 items-center gap-2 [@media(hover:hover)]:inline-flex"
    >
      <kbd className="kbd">?</kbd>
      Keyboard shortcuts
    </button>
  );
}
