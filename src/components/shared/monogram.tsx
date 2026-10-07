import { cn } from "@/lib/utils";

/** The aj mark: a key cap with a cursor. Decorative: the link around it carries the accessible name. */
export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden focusable="false" className={cn("text-foreground", className)}>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="currentColor" />
      <text
        x="27"
        y="41"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono), ui-monospace, monospace"
        fontSize="27"
        fontWeight="600"
        fill="var(--background)"
        letterSpacing="-1"
      >
        aj
      </text>
      <rect x="43" y="22" width="8" height="21" rx="1.5" fill="var(--primary)" />
    </svg>
  );
}
