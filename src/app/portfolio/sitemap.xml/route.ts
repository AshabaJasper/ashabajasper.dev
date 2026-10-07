import { featuredWork } from "@/data/work";
import { siteUrl } from "@/lib/sites";

const LASTMOD = "2026-10-07";

/** Public, indexable portfolio pages only. No thanks page, no 404, no filtered /work views. */
function sitemapPaths(): string[] {
  return [
    "/",
    "/work",
    ...featuredWork().map((item) => `/work/${item.slug}`),
    "/about",
    "/now",
    "/contact",
    "/privacy",
    "/terms",
  ];
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function GET(): Response {
  const urls = sitemapPaths()
    .map((path) => `  <url>\n    <loc>${escapeXml(siteUrl("portfolio", path))}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n  </url>`)
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
