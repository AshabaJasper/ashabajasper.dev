import { LOGOS, type LogoData, type LogoSlug } from "@/data/tech-logos";
import { LogoSvg } from "@/components/portfolio/logo";
import { techFallbackIcon, techSlug } from "@/components/portfolio/tech-map";
import { cn } from "@/lib/utils";

/**
 * Technology logos for server components. Client components never import
 * this file (it carries the logo table); they receive `logosFor()` data as a
 * prop instead, so only the logos they draw reach the browser.
 */

export type LogoProps = Record<string, { path: string; hex: string | null }>;

export function logoBySlug(slug: string): LogoData | null {
  return slug in LOGOS ? LOGOS[slug as LogoSlug] : null;
}

export function logoFor(name: string): LogoData | null {
  const slug = techSlug(name);
  return slug ? logoBySlug(slug) : null;
}

/** Path data for technology names or logo slugs, keyed as given, for client props. */
export function logosFor(keys: Iterable<string>): LogoProps {
  const out: LogoProps = {};
  for (const key of keys) {
    const logo = logoFor(key) ?? logoBySlug(key);
    if (logo) out[key] = { path: logo.path, hex: logo.hex };
  }
  return out;
}

/** A technology's logo, or a lucide stand-in when it has none. Always decorative. */
export function TechLogo({ name, className, brand = false }: { name: string; className?: string; brand?: boolean }) {
  const logo = logoFor(name) ?? logoBySlug(name);
  if (logo) return <LogoSvg path={logo.path} hex={logo.hex} brand={brand} className={className} />;
  const Icon = techFallbackIcon(name);
  return <Icon aria-hidden className={cn("size-4 shrink-0", className)} strokeWidth={1.75} />;
}

/** Logo chips for a stack. Renders nothing for an empty stack. */
export function TechChips({
  stack,
  className,
  size = "sm",
  label = "Built with",
}: {
  stack: readonly string[];
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  if (stack.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label={label}>
      {stack.map((tech) => (
        <li
          key={tech}
          className={cn(
            "tech-chip border-rule bg-card/70 text-ink-soft inline-flex items-center rounded-full border font-mono leading-none",
            size === "md" ? "gap-2 px-3 py-2 text-[0.78rem]" : "gap-1.5 px-2.5 py-1.5 text-[0.7rem]",
          )}
        >
          <TechLogo name={tech} brand className={size === "md" ? "size-4" : "size-3.5"} />
          {tech}
        </li>
      ))}
    </ul>
  );
}
