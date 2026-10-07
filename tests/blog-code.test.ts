import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compile } from "@mdx-js/mdx";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { bundledLanguages } from "shiki";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { parsePost } from "@/lib/content/parse";

/**
 * Code highlighting with the options src/lib/content/mdx.tsx uses (that module
 * is server-only and renders JSX, so the options are repeated here). An
 * unknown or missing language must fall back to plain text, never throw.
 */

const OPTIONS = {
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  keepBackground: false,
  bypassInlineCode: true,
  defaultLang: { block: "plaintext" },
};

const FIXTURES = join(process.cwd(), "tests", "fixtures", "posts");

async function compiled(body: string): Promise<string> {
  const file = await compile(body, {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypePrettyCode, OPTIONS]],
  });
  return String(file);
}

describe("code highlighting", () => {
  it("highlights the fixture with a title, line highlights and both themes", async () => {
    const body = parsePost("engine-fixture", readFileSync(join(FIXTURES, "engine-fixture.mdx"), "utf8")).body;
    const out = await compiled(body);
    expect(out).toContain("src/lib/money.ts");
    expect(out).toContain("data-highlighted-line");
    expect(out).toContain("--shiki-light");
    expect(out).toContain("--shiki-dark");
    expect(out).toContain("this must render as plain text");
    expect(out).toContain("no language at all");
  }, 60_000);

  it("has a bundled grammar for every language posts rely on", () => {
    const needed = ["ts", "tsx", "js", "json", "bash", "sh", "sql", "prisma", "yaml", "dockerfile", "diff"];
    expect(needed.filter((lang) => !(lang in bundledLanguages))).toEqual([]);
  });

  it("highlights a TypeScript block with more than one token colour", async () => {
    const out = await compiled("```ts\nexport const answer: number = 42;\n```\n");
    // Compiled MDX holds the style either as a string or as an object literal.
    const colours = new Set(out.match(/--shiki-light["']?\s*:\s*["']?#[0-9a-fA-F]{3,8}/g) ?? []);
    expect(colours.size).toBeGreaterThan(1);
  }, 60_000);
});
