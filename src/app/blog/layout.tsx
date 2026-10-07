import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { CommandCenter } from "@/components/shared/command-center";
import { ViewTransitions } from "@/components/shared/view-transitions";
import { getAllPosts } from "@/lib/content/posts";
import { Umami } from "@/components/analytics/umami";
import { profile } from "@/data/profile";
import { siteOrigin, siteUrl } from "@/lib/sites";
import { PRIMARY_NAV, crossHref } from "@/lib/links";
import "./blog.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin("blog")),
  title: {
    default: `Writing · ${profile.name}`,
    template: `%s · ${profile.name}`,
  },
  description: `Notes on building data, AI and business systems in East Africa, by ${profile.name}.`,
  alternates: {
    types: { "application/rss+xml": [{ url: siteUrl("blog", "/feed.xml"), title: `${profile.name}, Writing` }] },
  },
};

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader site="blog" homeHref={crossHref("blog", "portfolio", "/")} navItems={PRIMARY_NAV.map((item) => ({
        ...item, href: crossHref("blog", item.site, item.path),
      }))} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter site="blog" />
      <CommandCenter
        posts={(await getAllPosts()).map((post) => ({ slug: post.slug, title: post.title }))}
        portfolioPrefix={siteOrigin("portfolio")}
        blogPrefix={""}
      />
      <ViewTransitions />
      <Umami />
    </>
  );
}
