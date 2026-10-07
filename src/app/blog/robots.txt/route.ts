import { buildRobots } from "@/lib/content/feed";

export const runtime = "nodejs";

/** The blog is public: crawl everything, and here is the sitemap. */
export function GET() {
  return new Response(buildRobots(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
