import { getAllPosts } from "@/lib/content/posts";
import { buildSitemap } from "@/lib/content/feed";

export const runtime = "nodejs";
export const revalidate = 3600;

/** Index, posts, the topic index and each topic, on the blog origin. Drafts and error pages are never listed. */
export async function GET() {
  return new Response(buildSitemap(await getAllPosts()), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
