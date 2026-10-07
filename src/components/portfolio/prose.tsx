import { cn } from "@/lib/utils";

/**
 * Long-form reading column for about, now and the legal pages: 68ch measure,
 * serif section headings, relaxed body text. Styles plain h2, h3, p, ul and a.
 */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-ink-soft max-w-[68ch] text-[1.06rem] leading-[1.75] sm:text-[1.1rem]",
        "[&_h2]:text-foreground [&_h2]:mt-14 [&_h2]:font-serif [&_h2]:text-[1.9rem] [&_h2]:leading-tight [&_h2]:tracking-[-0.01em] [&>h2:first-child]:mt-0",
        "[&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:text-[1.06rem] [&_h3]:font-semibold [&_h3+p]:mt-2",
        "[&_p]:mt-5 [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_li]:marker:text-muted-foreground",
        "[&_strong]:text-foreground [&_strong]:font-semibold",
        className,
      )}
    >
      {children}
    </div>
  );
}
