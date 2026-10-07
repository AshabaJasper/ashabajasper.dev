import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@mdx-js/mdx";
import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { parsePost } from "@/lib/content/parse";
import { extractToc } from "@/lib/content/toc";

/**
 * The table of contents must link to the ids the rendered post really has.
 * This compiles the fixture through MDX with rehype-slug, exactly as the
 * page does, and compares every h2 and h3 id with extractToc().
 */

const FIXTURES = join(process.cwd(), "tests", "fixtures", "posts");

function fixtureBody(slug: string): string {
  return parsePost(slug, readFileSync(join(FIXTURES, `${slug}.mdx`), "utf8")).body;
}

async function renderedHeadings(body: string): Promise<{ id: string; text: string; depth: number }[]> {
  const found: { id: string; text: string; depth: number }[] = [];
  const collect = () => (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "h2" || node.tagName === "h3") {
        found.push({ id: String(node.properties?.id ?? ""), text: toString(node).trim(), depth: Number(node.tagName[1]) });
      }
    });
  };
  await compile(body, { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug, collect] });
  return found;
}

describe("extractToc", () => {
  it("matches rehype-slug ids on the engine fixture, duplicates and inline code included", async () => {
    const body = fixtureBody("engine-fixture");
    const rendered = await renderedHeadings(body);
    const toc = extractToc(body);
    expect(rendered.length).toBeGreaterThan(5);
    expect(toc.map(({ id, depth }) => ({ id, depth }))).toEqual(rendered.map(({ id, depth }) => ({ id, depth })));
    expect(toc.map((item) => item.text)).toEqual(rendered.map((item) => item.text));
  });

  it("numbers duplicates across all heading levels, like rehype-slug", () => {
    const ids = extractToc(fixtureBody("engine-fixture")).map((item) => item.id);
    expect(ids).toContain("getting-started");
    expect(ids).toContain("getting-started-1");
    // The h4 "Getting started" takes -2, so the third h2 is -3.
    expect(ids).toContain("getting-started-3");
    expect(ids).not.toContain("getting-started-2");
    expect(ids).toContain("the-money-column");
  });

  it("keeps only h2 and h3", () => {
    const toc = extractToc("# One\n\n## Two\n\n### Three\n\n#### Four\n");
    expect(toc).toEqual([
      { id: "two", text: "Two", depth: 2 },
      { id: "three", text: "Three", depth: 3 },
    ]);
  });

  it("starts a fresh slugger for every document", () => {
    expect(extractToc("## Same")[0].id).toBe("same");
    expect(extractToc("## Same")[0].id).toBe("same");
  });

  it("ignores headings inside code blocks", () => {
    expect(extractToc("```md\n## Not a heading\n```\n\n## Real\n")).toEqual([{ id: "real", text: "Real", depth: 2 }]);
  });
});
