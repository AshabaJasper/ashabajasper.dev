import type { Metadata } from "next";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { Umami } from "@/components/analytics/umami";
import { profile } from "@/data/profile";
import { siteOrigin, siteUrl } from "@/lib/sites";
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

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader site="blog" />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <SiteFooter site="blog" />
      <Umami />
    </>
  );
}
