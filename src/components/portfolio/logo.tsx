import { cn } from "@/lib/utils";

/**
 * One technology logo from its simple-icons path data. Decorative by default
 * (the technology name is always printed next to it); pass `title` to give it
 * an accessible name. Client safe: it takes the path, not the logo table.
 */
export function LogoSvg({
  path,
  hex,
  title,
  className,
  brand = false,
}: {
  path: string;
  hex?: string | null;
  title?: string;
  className?: string;
  /** Draw in the brand colour when it reads on both canvases; otherwise the text colour. */
  brand?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-4 shrink-0", className)}
      fill={brand && hex ? hex : "currentColor"}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <path d={path} />
    </svg>
  );
}
