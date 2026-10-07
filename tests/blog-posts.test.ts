import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@mdx-js/mdx";
import type { Element, Root } from "hast";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parsePost } from "@/lib/content/parse";
import { extractToc } from "@/lib/content/toc";
import { postKicker, tagLabel } from "@/components/blog/format";
import { blogMetadata } from "@/components/blog/metadata";

/**
 * The real posts in content/posts (not fixtures): every table of contents
 * entry must point at an id the rendered post really has. Plus the label and
 * metadata helpers the blog pages share.
 */

const POSTS = join(process.cwd(), "content", "posts");
const files = (() => {
  try {
    return readdirSync(POSTS).filter((name) => name.endsWith(".mdx"));
  } catch {
    return [];
  }
})();

async function renderedIds(body: string): Promise<string[]> {
  const ids: string[] = [];
  const collect = () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "h2" || node.tagName === "h3") ids.push(String(node.properties?.id ?? ""));
    });
  };
  await compile(body, { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, collect] });
  return ids;
}

describe.skipIf(files.length === 0)("published posts", () => {
  it.each(files)("%s: table of contents ids match the rendered headings", async (name) => {
    const post = parsePost(name.slice(0, -4), readFileSync(join(POSTS, name), "utf8"));
    const toc = extractToc(post.body);
    expect(toc.length).toBeGreaterThan(0);
    expect(toc.map((item) => item.id)).toEqual(await renderedIds(post.body));
    expect(new Set(toc.map((item) => item.id)).size).toBe(toc.length);
  }, 60_000);
});

describe("tagLabel", () => {
  it("spells known names properly", () => {
    expect(tagLabel("nextjs")).toBe("Next.js");
    expect(tagLabel("nextjs")).toBe("Next.js");
    expect(tagLabel("typescript")).toBe("TypeScript");
    expect(tagLabel("self-hosting")).toBe("Self-hosting");
  });

  it("falls back to capitalised words", () => {
    expect(tagLabel("data-modelling")).toBe("Data modelling");
    expect(tagLabel("security")).toBe("Security");
  });

  it("labels the kicker of a post outside a series by its first topic", () => {
    expect(postKicker({ series: null, tags: ["nextjs", "docker"] })).toBe("Next.js");
    expect(postKicker({ series: { name: "Building HMS", part: 2 }, tags: ["money"] })).toBe("Building HMS, part 2");
    expect(postKicker({ series: null, tags: [] })).toBe("Writing");
  });
});

describe("blogMetadata", () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env.ROOT_DOMAIN;
    delete process.env.ROOT_DOMAIN;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.ROOT_DOMAIN;
    else process.env.ROOT_DOMAIN = saved;
  });

  it("keeps the canonical and adds the RSS feed, all absolute on the blog origin", () => {
    const meta = blogMetadata({ path: "/money-as-integer-minor-units", title: "Money is an integer", description: "A description long enough." });
    expect(meta.alternates?.canonical).toBe("https://blog.ashabajasper.dev/money-as-integer-minor-units");
    expect(JSON.stringify(meta.alternates?.types)).toContain("https://blog.ashabajasper.dev/feed.xml");
    expect(meta.openGraph?.url).toBe("https://blog.ashabajasper.dev/money-as-integer-minor-units");
    expect(JSON.stringify(meta.openGraph?.images)).toContain("https://blog.ashabajasper.dev/og");
    expect(JSON.stringify(meta)).not.toContain("/blog/");
  });
});
