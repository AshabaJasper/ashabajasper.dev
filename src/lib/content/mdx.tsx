import "server-only";
import type { ReactElement } from "react";
import { compileMDX } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings, { type Options as AutolinkOptions } from "rehype-autolink-headings";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/blog/mdx-components";

/**
 * Renders a post body on the server. Plugin order matters: rehype-slug sets
 * the heading ids that src/lib/content/toc.ts reproduces, then the headings
 * are wrapped in a self-link, then code is highlighted.
 *
 * Code blocks: dual themes switched by CSS (blog.css), no inline background,
 * `title="file.ts"` for a filename caption and `{1,3-4}` for highlighted
 * lines. A block with no language, or one shiki does not know, renders as
 * plain text instead of failing the page.
 */

export const prettyCodeOptions: PrettyCodeOptions = {
  theme: { light: "github-light", dark: "github-dark-dimmed" },
  keepBackground: false,
  bypassInlineCode: true,
  defaultLang: { block: "plaintext" },
};

const autolinkOptions: AutolinkOptions = {
  behavior: "wrap",
  test: ["h2", "h3", "h4"],
  properties: { className: ["heading-anchor"] },
};

export async function renderPostBody(source: string): Promise<ReactElement> {
  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      // Posts are trusted files, but they never need JS expressions; keep them out.
      blockJS: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, autolinkOptions], [rehypePrettyCode, prettyCodeOptions]],
      },
    },
  });
  return content;
}
