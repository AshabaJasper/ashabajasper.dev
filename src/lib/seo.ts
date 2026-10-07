import type { Metadata } from "next";
import { profile } from "@/data/profile";
import { siteUrl, type Site } from "@/lib/sites";

export interface PageSeo {
  site: Exclude<Site, "admin">;
  /** Public path on that site, for example "/work/hms". */
  path: string;
  /** Page title without the site suffix; the layout template adds it. */
  title: string;
  description: string;
  /** Absolute or site-relative URL of a 1200x630 image. Defaults to the site card. */
  image?: string;
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  /** Use the title as-is, without the layout template (home pages). */
  absoluteTitle?: boolean;
}

/**
 * Page metadata with absolute canonical, Open Graph and Twitter values.
 * Every public page builds its metadata through this so nothing points at
 * an internal /portfolio or /blog path.
 */
export function pageMetadata(seo: PageSeo): Metadata {
  const url = siteUrl(seo.site, seo.path);
  const image = seo.image
    ? seo.image.startsWith("http")
      ? seo.image
      : siteUrl(seo.site, seo.image)
    : siteUrl(seo.site, "/og");
  const imageAlt = seo.imageAlt ?? `${seo.title}, ${profile.name}`;
  const ogTitle = seo.absoluteTitle ? seo.title : `${seo.title} · ${profile.name}`;

  return {
    title: seo.absoluteTitle ? { absolute: seo.title } : seo.title,
    description: seo.description,
    alternates: { canonical: url },
    openGraph: {
      type: seo.type ?? "website",
      url,
      title: ogTitle,
      description: seo.description,
      siteName: seo.site === "blog" ? `${profile.name}, Writing` : profile.name,
      locale: "en_GB",
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
      ...(seo.type === "article"
        ? {
            publishedTime: seo.publishedTime,
            modifiedTime: seo.modifiedTime,
            authors: [siteUrl("portfolio", "/about")],
            tags: seo.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: seo.description,
      creator: profile.xHandle,
      images: [{ url: image, alt: imageAlt }],
    },
  };
}
