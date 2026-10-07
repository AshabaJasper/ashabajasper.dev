import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { parsePost, sortPosts, summarize, type Post, type PostSummary } from "./parse";

/**
 * Server loader for content/posts/*.mdx. The filename is the slug. Drafts
 * are visible in development only. Every reader is memoised per request.
 */

export const POSTS_DIR = path.join(process.cwd(), "content", "posts");

const includeDrafts = process.env.NODE_ENV === "development";

async function loadAll(): Promise<Post[]> {
  let names: string[];
  try {
    names = await readdir(POSTS_DIR);
  } catch {
    return [];
  }
  const files = names.filter((name) => name.endsWith(".mdx"));
  const posts = await Promise.all(
    files.map(async (name) => parsePost(name.slice(0, -4), await readFile(path.join(POSTS_DIR, name), "utf8"))),
  );
  return sortPosts(posts.filter((post) => includeDrafts || !post.draft));
}

const loadAllCached = cache(loadAll);

/** Published posts, newest first, without bodies. */
export const getAllPosts = cache(async (): Promise<PostSummary[]> => (await loadAllCached()).map(summarize));

/** One published post with its MDX body, or null. */
export const getPost = cache(async (slug: string): Promise<Post | null> => {
  return (await loadAllCached()).find((post) => post.slug === slug) ?? null;
});

/** Tags with how many published posts carry each, most used first. */
export const getAllTags = cache(async (): Promise<{ tag: string; count: number }[]> => {
  const counts = new Map<string, number>();
  for (const post of await loadAllCached()) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
});

export type { Post, PostSummary };
