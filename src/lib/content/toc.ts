import GithubSlugger from "github-slugger";
import type { Heading, Root } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

/**
 * The table of contents for a post: its h2 and h3 headings, with the ids
 * rehype-slug gives them when the post renders. Pure, so tests can prove
 * the two agree (tests/toc.test.ts).
 *
 * Parity with rehype-slug:
 * - one fresh slugger per document, fed EVERY heading (h1 to h6) in order,
 *   so duplicate numbering ("setup", "setup-1") matches even when an h4
 *   shares a name with an h2
 * - the text is the heading's plain text: inline code keeps its value,
 *   image alt text and raw HTML contribute nothing (hast has no text there)
 */

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

const parser = unified().use(remarkParse).use(remarkGfm);

export function extractToc(body: string): TocItem[] {
  const tree = parser.runSync(parser.parse(body)) as Root;
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];

  visit(tree, "heading", (node: Heading) => {
    const text = toString(node, { includeImageAlt: false, includeHtml: false });
    const id = slugger.slug(text);
    if (node.depth === 2 || node.depth === 3) {
      const label = text.trim();
      if (label) items.push({ id, text: label, depth: node.depth });
    }
  });

  return items;
}
