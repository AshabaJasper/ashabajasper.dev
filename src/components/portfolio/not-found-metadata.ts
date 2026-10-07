import type { Metadata } from "next";

/**
 * Metadata for the portfolio 404, shared by not-found.tsx and the
 * [...missing] catch-all. The catch-all needs it too: without its own
 * metadata the client swaps the 404 title for the layout default after
 * hydration.
 */
export const NOT_FOUND_METADATA: Metadata = {
  title: "Page not found",
  description: "There is no page at this address on ashabajasper.dev. Try the work, the writing or the home page.",
  robots: { index: false, follow: true },
};
