import { cn } from "@/lib/utils";

/**
 * Status as a word first, with a quiet tone behind it. Colour is never the
 * only signal: the label always says what the state is.
 */

type Tone = "accent" | "neutral" | "muted" | "warning";

const TONES: Record<Tone, string> = {
  accent: "bg-accent text-accent-foreground border-transparent",
  neutral: "bg-muted text-ink-soft border-transparent",
  muted: "text-muted-foreground border-rule bg-transparent",
  warning: "border-destructive/30 text-destructive bg-transparent",
};

const STATUS: Record<string, { label: string; tone: Tone }> = {
  NEW: { label: "New", tone: "accent" },
  READ: { label: "Read", tone: "neutral" },
  REPLIED: { label: "Replied", tone: "muted" },
  ARCHIVED: { label: "Archived", tone: "muted" },
  SPAM: { label: "Spam", tone: "warning" },
  PENDING: { label: "Pending", tone: "accent" },
  APPROVED: { label: "Approved", tone: "neutral" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const entry = STATUS[status] ?? { label: status, tone: "muted" as const };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[0.68rem] font-medium tracking-[0.08em] whitespace-nowrap uppercase",
        TONES[entry.tone],
        className,
      )}
    >
      {entry.label}
    </span>
  );
}
