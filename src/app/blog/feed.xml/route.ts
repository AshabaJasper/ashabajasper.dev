import { getAllPosts } from "@/lib/content/posts";
import { buildRssFeed } from "@/lib/content/feed";

export const runtime = "nodejs";
export const revalidate = 3600;

/** RSS 2.0 for the blog. Links are absolute on the blog origin. */
export async function GET() {
  const xml = buildRssFeed(await getAllPosts());
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
