"use client";

import { profile } from "@/data/profile";
import { track } from "@/lib/analytics";

/**
 * A mailto link that records an "email-click" event (with only the place it
 * was clicked, never anything about the visitor). A tiny client island so
 * the pages around it stay server rendered.
 */
export function EmailLink({
  placement,
  className,
  children,
}: {
  /** Where the link sits, for example "hero" or "case-study". */
  placement: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a href={`mailto:${profile.email}`} className={className} onClick={() => track("email-click", { placement })}>
      {children ?? profile.email}
    </a>
  );
}
