import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HANDWRITING_CNN, layerShapes, totalParams } from "@/components/blog/cnn-shapes";
import { FIGURE_ICONS } from "@/components/blog/figure-icons";
import { MDX_COMPONENT_NAMES } from "@/components/blog/mdx-names";
import { extractToc } from "@/lib/content/toc";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const posts = readdirSync(POSTS_DIR)
  .filter((name) => name.endsWith(".mdx"))
  .map((name) => ({ name, source: readFileSync(path.join(POSTS_DIR, name), "utf8") }));

describe("handwriting CNN shapes", () => {
  it("matches the model in the post, layer by layer", () => {
    const layers = layerShapes(HANDWRITING_CNN);
    expect(layers.map((layer) => layer.shape)).toEqual([
      "28×28×1",
      "26×26×32",
      "13×13×32",
      "13×13×64",
      "6×6×64",
      "4×4×128",
      "2×2×128",
      "512",
      "64",
      "128",
      "26",
    ]);
  });

  it("counts the trainable parameters", () => {
    const layers = layerShapes(HANDWRITING_CNN);
    expect(layers.map((layer) => layer.params)).toEqual([0, 320, 0, 18496, 0, 73856, 0, 0, 32832, 8320, 3354]);
    expect(totalParams(layers)).toBe(137178);
  });
});

describe("MDX figure components", () => {
  it("lists exactly the components in the MDX map", () => {
    // Read as text: vitest here does not compile JSX, and the map is a plain object literal.
    const source = readFileSync(path.join(process.cwd(), "src", "components", "blog", "mdx-components.tsx"), "utf8");
    const body = source.slice(source.indexOf("export const mdxComponents"));
    const mapped = [...body.matchAll(/^\s+([A-Z][A-Za-z0-9]*),?$/gm)].map((match) => match[1]);
    expect([...mapped].sort()).toEqual([...MDX_COMPONENT_NAMES].sort());
  });

  it.each(posts)("$name names only icons that exist", ({ source }) => {
    const icons = [...source.matchAll(/\bicon="([^"]+)"/g)].map((match) => match[1]);
    for (const icon of icons) expect(FIGURE_ICONS, `icon "${icon}"`).toHaveProperty(icon);
  });

  it.each(posts)("$name card links point at real headings", ({ source }) => {
    const ids = new Set(extractToc(source.replace(/^---[\s\S]*?---/, "")).map((item) => item.id));
    const hrefs = [...source.matchAll(/<Card\b[^>]*\bhref="#([^"]+)"/g)].map((match) => match[1]);
    for (const href of hrefs) expect(ids.has(href), `#${href}`).toBe(true);
  });

  it.each(posts)("$name diagrams carry a caption and a text summary", ({ source }) => {
    for (const match of source.matchAll(/<Diagram\b([^>]*)>/g)) {
      expect(match[1]).toMatch(/\bcaption="[^"]+"/);
      expect(match[1]).toMatch(/\bsummary="[^"]+"/);
    }
  });
});
