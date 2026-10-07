import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Umami } from "@/components/analytics/umami";
import { profile } from "@/data/profile";
import { siteOrigin, siteUrl } from "@/lib/sites";

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
      <SiteHeader site="portfolio" />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter site="portfolio" />
      <Umami />
    </>
  );
}
