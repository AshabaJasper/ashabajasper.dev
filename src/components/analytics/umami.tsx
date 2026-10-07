import Script from "next/script";
import { umamiConfig } from "@/lib/env";
import { rootDomain } from "@/lib/sites";

/**
 * Cookieless Umami on public hosts only, following the owner's banner decision.
 * Excludes URL queries and fragments, and respects Do Not Track.
 * Renders nothing until both public build-time values are configured.
 */
export function Umami() {
  const config = umamiConfig();
  if (!config) return null;
  const root = rootDomain().replace(/:\d+$/, "");
  return (
    <Script
      src={config.scriptUrl}
      data-website-id={config.websiteId}
      data-domains={`${root},blog.${root}`}
      data-exclude-search="true"
      data-exclude-hash="true"
      data-do-not-track="true"
      strategy="afterInteractive"
      defer
    />
  );
}
