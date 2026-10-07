import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CopyButton } from "@/components/blog/copy-button";
import { cn } from "@/lib/utils";

/**
 * The only components a post may use, beyond standard Markdown: headings,
 * links, code blocks, tables and the <Note> callout. Heading anchors come
 * from rehype-autolink-headings (the heading text is wrapped in a link to
 * itself, so a screen reader still reads the plain heading), code blocks
 * from rehype-pretty-code.
 */

function Heading2({ className, ...props }: ComponentPropsWithoutRef<"h2">) {
  return <h2 className={cn("post-heading", className)} {...props} />;
}

function Heading3({ className, ...props }: ComponentPropsWithoutRef<"h3">) {
  return <h3 className={cn("post-heading", className)} {...props} />;
}

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

function Anchor({ href = "", children, className, ...props }: ComponentPropsWithoutRef<"a">) {
  if (href.startsWith("/") && !href.startsWith("//")) {
    return (
      <Link href={href} className={className} {...props}>
        {children}
      </Link>
    );
  }
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn("external-link", className)} {...props}>
        {children}
        <ArrowUpRight aria-hidden className="external-link-icon" strokeWidth={1.75} />
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  // In-page anchors (#section), heading self-links and mailto.
  return (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  );
}

type DataProps = { "data-rehype-pretty-code-figure"?: string; "data-rehype-pretty-code-title"?: string };

function Figure({ className, ...props }: ComponentPropsWithoutRef<"figure"> & DataProps) {
  const isCode = props["data-rehype-pretty-code-figure"] !== undefined;
  return <figure className={cn(isCode && "code-figure", className)} data-code-block={isCode ? "" : undefined} {...props} />;
}

function FigCaption({ className, ...props }: ComponentPropsWithoutRef<"figcaption"> & DataProps) {
  const isTitle = props["data-rehype-pretty-code-title"] !== undefined;
  if (isTitle) {
    return (
      <figcaption className={cn("code-title", className)} {...props}>
        <span className="sr-only">File: </span>
        {props.children}
      </figcaption>
    );
  }
  return <figcaption className={className} {...props} />;
}

function Pre({ className, children, ...props }: ComponentPropsWithoutRef<"pre">) {
  return (
    <div className="code-shell">
      <pre className={cn("code-pre", className)} tabIndex={0} {...props}>
        {children}
      </pre>
      <CopyButton />
    </div>
  );
}

function Table({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    // A keyboard user can scroll a wide table once it has focus.
    <div role="region" aria-label="Table, scrolls sideways" tabIndex={0} className="table-scroll">
      <table className={className} {...props} />
    </div>
  );
}

export function Note({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <div role="note" className="post-note">
      {title ? <p className="post-note-title">{title}</p> : null}
      <div className="post-note-body">{children}</div>
    </div>
  );
}

export const mdxComponents = {
  h2: Heading2,
  h3: Heading3,
  a: Anchor,
  figure: Figure,
  figcaption: FigCaption,
  pre: Pre,
  table: Table,
  Note,
};
