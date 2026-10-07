import { siteUrl } from "@/lib/sites";

/** robots.txt for ashabajasper.dev. The thanks page is reachable but not worth indexing. */
export function GET(): Response {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /contact/thanks",
    "",
    `Sitemap: ${siteUrl("portfolio", "/sitemap.xml")}`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
