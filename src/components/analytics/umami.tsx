import Script from "next/script";
import { umamiConfig } from "@/lib/env";
import { rootDomain } from "@/lib/sites";

/**
 * Self-hosted Umami: cookieless, no personal data, so no consent banner is
 * needed. Rendered only on the portfolio and blog layouts, never on admin.
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
      strategy="afterInteractive"
      defer
    />
  );
}
