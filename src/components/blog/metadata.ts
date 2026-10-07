import type { Metadata } from "next";
import { profile } from "@/data/profile";
import { pageMetadata, type PageSeo } from "@/lib/seo";
import { siteUrl } from "@/lib/sites";

/**
 * Metadata for a public blog page. Next merges `alternates` shallowly, so a
 * page that sets a canonical URL would drop the layout's RSS link. This adds
 * the feed back next to the canonical on every page.
 */

export function rssAlternate(): NonNullable<Metadata["alternates"]>["types"] {
  return { "application/rss+xml": [{ url: siteUrl("blog", "/feed.xml"), title: `${profile.name}, Writing` }] };
}

export function blogMetadata(seo: Omit<PageSeo, "site">): Metadata {
  const meta = pageMetadata({ site: "blog", ...seo });
  return { ...meta, alternates: { ...meta.alternates, types: rssAlternate() } };
}
