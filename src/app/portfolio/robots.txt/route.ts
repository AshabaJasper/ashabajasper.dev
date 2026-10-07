import { robotsBody } from "@/lib/crawlers";
import { siteUrl } from "@/lib/sites";

/** robots.txt for the portfolio: open to search and AI crawlers. The thanks page is not worth indexing. */
export function GET(): Response {
  const body = robotsBody({
    sitemap: siteUrl("portfolio", "/sitemap.xml"),
    llms: siteUrl("portfolio", "/llms.txt"),
    disallow: ["/contact/thanks"],
  });
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
