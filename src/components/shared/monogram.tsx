import { cn } from "@/lib/utils";

/** The AJ mark. Decorative: the link around it carries the accessible name. */
export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden focusable="false" className={cn("text-primary", className)}>
      <circle cx="32" cy="32" r="32" fill="currentColor" />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily="var(--font-instrument-serif), Georgia, serif"
        fontSize="30"
        fill="var(--primary-foreground)"
        letterSpacing="-0.5"
      >
        AJ
      </text>
    </svg>
  );
}
