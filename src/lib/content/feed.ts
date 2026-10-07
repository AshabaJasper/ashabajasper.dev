import { robotsBody } from "@/lib/crawlers";
import { Feed } from "feed";
import { profile } from "@/data/profile";
import { siteUrl } from "@/lib/sites";
import type { PostSummary } from "./parse";

/**
 * The blog's machine-readable surfaces: RSS, sitemap and robots.txt. Pure
 * builders over post summaries, so the route handlers stay thin and the
 * tests never touch the file system. Every URL is absolute on the blog
 * origin from siteUrl(), never from request headers.
 */

export const BLOG_TITLE = `${profile.name}, Writing`;
export const BLOG_DESCRIPTION = `Notes on building data, AI and business systems in East Africa, by ${profile.name}.`;

function published<T extends PostSummary>(posts: T[]): T[] {
  return posts.filter((post) => !post.draft);
}

function utc(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

export function postUrl(slug: string): string {
  return siteUrl("blog", `/${slug}`);
}

export function tagPath(tag: string): string {
  return `/tags/${encodeURIComponent(tag)}`;
}

/** RSS 2.0. The channel date is the newest post's, so the output is stable. */
export function buildRssFeed(posts: PostSummary[]): string {
  const items = published(posts);
  const newest = items.reduce<string | null>((max, post) => {
    const last = post.updated ?? post.date;
    return max === null || last > max ? last : max;
  }, null);

  const author = { name: profile.name, email: profile.email, link: siteUrl("portfolio", "/about") };
  const feed = new Feed({
    id: siteUrl("blog", "/"),
    link: siteUrl("blog", "/"),
    title: BLOG_TITLE,
    description: BLOG_DESCRIPTION,
    language: "en-GB",
    image: siteUrl("blog", "/og"),
    favicon: siteUrl("blog", "/favicon.ico"),
    copyright: `Copyright ${profile.fullName}`,
    updated: newest ? utc(newest) : undefined,
    generator: false,
    feedLinks: { rss: siteUrl("blog", "/feed.xml") },
    author,
  });

  for (const post of items) {
    const url = postUrl(post.slug);
    feed.addItem({
      title: post.title,
      id: url,
      guid: url,
      link: url,
      description: post.description,
      date: utc(post.date),
      published: utc(post.date),
      category: post.tags.map((tag) => ({ name: tag, domain: siteUrl("blog", tagPath(tag)) })),
      author: [author],
    });
  }

  return feed.rss2();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface SitemapEntry {
  path: string;
  lastmod?: string;
}

/** Index, each published post, the tag index and each tag page. */
export function buildSitemap(posts: PostSummary[]): string {
  const items = published(posts);
  const lastOf = (list: PostSummary[]) =>
    list.reduce<string | undefined>((max, post) => {
      const last = post.updated ?? post.date;
      return max === undefined || last > max ? last : max;
    }, undefined);

  const tags = [...new Set(items.flatMap((post) => post.tags))].sort();
  const entries: SitemapEntry[] = [
    { path: "/", lastmod: lastOf(items) },
    ...items.map((post) => ({ path: `/${post.slug}`, lastmod: post.updated ?? post.date })),
    ...(tags.length > 0 ? [{ path: "/tags", lastmod: lastOf(items) }] : []),
    ...tags.map((tag) => ({ path: tagPath(tag), lastmod: lastOf(items.filter((post) => post.tags.includes(tag))) })),
  ];

  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "";
      return `  <url><loc>${escapeXml(siteUrl("blog", entry.path))}</loc>${lastmod}</url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobots(): string {
  return robotsBody({ sitemap: siteUrl("blog", "/sitemap.xml"), llms: siteUrl("blog", "/llms.txt") });
}
