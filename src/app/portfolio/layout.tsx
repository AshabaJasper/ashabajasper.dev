import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/site-header";
import { IdentityLinks } from "@/components/shared/identity-links";
import { SiteFooter } from "@/components/shared/site-footer";
import { CommandCenter } from "@/components/shared/command-center";
import { ViewTransitions } from "@/components/shared/view-transitions";
import { ScrollFx } from "@/components/shared/scroll-fx";
import { getAllPosts } from "@/lib/content/posts";
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

export default async function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <IdentityLinks />
      <SiteHeader site="portfolio" homeHref="/" navItems={PRIMARY_NAV.map((item) => ({
        ...item, href: crossHref("portfolio", item.site, item.path),
      }))} />
      <ScrollFx />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter site="portfolio" />
      {/* Renders only on the home, work, case study and contact pages, under 768px. */}
      <StickyCta />
      <CommandCenter
        posts={(await getAllPosts()).map((post) => ({ slug: post.slug, title: post.title }))}
        portfolioPrefix={""}
        blogPrefix={siteOrigin("blog")}
      />
      <ViewTransitions />
      <Umami />
    </>
  );
}
