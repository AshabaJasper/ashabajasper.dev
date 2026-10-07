import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parsePost, sortPosts, summarize } from "@/lib/content/parse";
import { buildRssFeed } from "@/lib/content/feed";

const FIXTURES = join(process.cwd(), "tests", "fixtures", "posts");

function fixtures() {
  return sortPosts(
    readdirSync(FIXTURES)
      .filter((name) => name.endsWith(".mdx"))
      .map((name) => summarize(parsePost(name.slice(0, -4), readFileSync(join(FIXTURES, name), "utf8")))),
  );
}

describe("RSS feed", () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.ROOT_DOMAIN;
    delete process.env.ROOT_DOMAIN;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.ROOT_DOMAIN;
    else process.env.ROOT_DOMAIN = saved;
  });

  it("is RSS 2.0 with absolute links on https://blog.ashabajasper.dev", () => {
    const xml = buildRssFeed(fixtures());
    expect(xml).toMatch(/<rss[^>]*version="2.0"/);
    expect(xml).toContain("<link>https://blog.ashabajasper.dev/</link>");
    expect(xml).toContain("<link>https://blog.ashabajasper.dev/engine-fixture</link>");
    expect(xml).toContain("<link>https://blog.ashabajasper.dev/another-post</link>");
    expect(xml).toContain('href="https://blog.ashabajasper.dev/feed.xml"');
    expect(xml).toMatch(/rel="self"/);
    // No relative or internal links anywhere.
    expect(xml).not.toMatch(/<link>\//);
    expect(xml).not.toContain("/blog/");
    expect(xml).not.toContain("localhost");
  });

  it("leaves drafts out", () => {
    const posts = fixtures();
    expect(posts.some((post) => post.draft)).toBe(true);
    const xml = buildRssFeed(posts);
    expect(xml).not.toContain("draft-fixture");
    expect(xml).not.toContain("must never be published");
  });

  it("carries title, description, author, categories and pubDate", () => {
    const xml = buildRssFeed(fixtures());
    expect(xml).toContain("Ashaba Jasper, Writing");
    expect(xml).toContain("Another fixture post");
    expect(xml).toContain("ashabajasper@gmail.com (Ashaba Jasper)");
    expect(xml).toContain("<category");
    expect(xml).toContain("nextjs");
    expect(xml).toContain("<pubDate>Sun, 20 Sep 2026 00:00:00 GMT</pubDate>");
  });

  it("is stable for the same input (no wall-clock dates)", () => {
    expect(buildRssFeed(fixtures())).toBe(buildRssFeed(fixtures()));
  });

  it("follows ROOT_DOMAIN when it is set", () => {
    process.env.ROOT_DOMAIN = "localhost:3102";
    expect(buildRssFeed(fixtures())).toContain("<link>http://blog.localhost:3102/another-post</link>");
  });
});
