import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Umami } from "@/components/analytics/umami";
import { StickyCta } from "@/components/portfolio/sticky-cta";
import { profile } from "@/data/profile";
import { siteOrigin, siteUrl } from "@/lib/sites";
import { PRIMARY_NAV, crossHref } from "@/lib/links";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin("portfolio")),
  title: {
    default: `${profile.name}, software engineer and data scientist`,
    template: `%s · ${profile.name}`,
  },
  description: profile.heroLine,
  alternates: {
    types: { "application/rss+xml": [{ url: siteUrl("blog", "/feed.xml"), title: `${profile.name}, Writing` }] },
  },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader site="portfolio" homeHref="/" navItems={PRIMARY_NAV.map((item) => ({
        ...item, href: crossHref("portfolio", item.site, item.path),
      }))} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter site="portfolio" />
      {/* Renders only on the home, work, case study and contact pages, under 768px. */}
      <StickyCta />
      <Umami />
    </>
  );
}
