import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parsePost, sortPosts, summarize } from "@/lib/content/parse";

/**
 * The blog's robots.txt and sitemap.xml route handlers, fed the fixture
 * posts instead of content/posts. The posts loader is server-only, so it is
 * replaced with one that reads the fixtures.
 */

const FIXTURES = join(process.cwd(), "tests", "fixtures", "posts");

vi.mock("@/lib/content/posts", () => {
  const all = () =>
    sortPosts(
      readdirSync(FIXTURES)
        .filter((name) => name.endsWith(".mdx"))
        .map((name) => summarize(parsePost(name.slice(0, -4), readFileSync(join(FIXTURES, name), "utf8")))),
    );
  return { getAllPosts: async () => all() };
});

describe("blog route handlers", () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.ROOT_DOMAIN;
    delete process.env.ROOT_DOMAIN;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.ROOT_DOMAIN;
    else process.env.ROOT_DOMAIN = saved;
  });

  it("robots.txt allows crawling and names the blog sitemap", async () => {
    const { GET } = await import("@/app/blog/robots.txt/route");
    const res = GET();
    expect(res.headers.get("content-type")).toContain("text/plain");
    const text = await res.text();
    expect(text).toContain("User-agent: *");
    expect(text).toContain("Allow: /");
    expect(text).toContain("Sitemap: https://blog.ashabajasper.dev/sitemap.xml");
  });

  it("sitemap.xml lists the index, posts, topics and each topic with lastmod", async () => {
    const { GET } = await import("@/app/blog/sitemap.xml/route");
    const res = await GET();
    expect(res.headers.get("content-type")).toContain("application/xml");
    const xml = await res.text();
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<loc>https://blog.ashabajasper.dev/</loc><lastmod>2026-09-20</lastmod>");
    // updated wins over date for lastmod
    expect(xml).toContain("<loc>https://blog.ashabajasper.dev/engine-fixture</loc><lastmod>2026-09-15</lastmod>");
    expect(xml).toContain("<loc>https://blog.ashabajasper.dev/another-post</loc><lastmod>2026-09-20</lastmod>");
    expect(xml).toContain("<loc>https://blog.ashabajasper.dev/tags</loc>");
    expect(xml).toContain("<loc>https://blog.ashabajasper.dev/tags/testing</loc>");
    expect(xml).toContain("<loc>https://blog.ashabajasper.dev/tags/nextjs</loc><lastmod>2026-09-15</lastmod>");
  });

  it("sitemap.xml leaves out drafts, their tags and internal prefixes", async () => {
    const { GET } = await import("@/app/blog/sitemap.xml/route");
    const xml = await (await GET()).text();
    expect(xml).not.toContain("draft-fixture");
    expect(xml).not.toContain("/tags/drafts");
    expect(xml).not.toContain("/blog/");
    expect(xml).not.toContain("/og");
  });
});
