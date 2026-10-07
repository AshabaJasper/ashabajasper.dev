import matter from "gray-matter";
import readingTime from "reading-time";
import { frontmatterSchema, slugProblem } from "./schema";

/**
 * Parsing a post file. Pure (no fs), so tests and the content check share it
 * with the server loader in posts.ts.
 */

export interface PostSummary {
  slug: string;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  /** YYYY-MM-DD or null */
  updated: string | null;
  tags: string[];
  series: { name: string; part: number } | null;
  draft: boolean;
  ogTitle: string | null;
  /** Rounded, at least 1. */
  readingMinutes: number;
}

export interface Post extends PostSummary {
  /** MDX source without the frontmatter. */
  body: string;
}

export class PostError extends Error {
  constructor(slug: string, message: string) {
    super(`content/posts/${slug}.mdx: ${message}`);
    this.name = "PostError";
  }
}

/** YAML turns unquoted dates into Date objects; the schema wants YYYY-MM-DD strings. */
function normalizeDates(data: Record<string, unknown>): Record<string, unknown> {
  const out = { ...data };
  for (const key of ["date", "updated"]) {
    const value = out[key];
    if (value instanceof Date && !Number.isNaN(value.getTime())) out[key] = value.toISOString().slice(0, 10);
  }
  return out;
}

export function parsePost(slug: string, source: string): Post {
  const problem = slugProblem(slug);
  if (problem) throw new PostError(slug, problem);

  const { data, content } = matter(source);
  const parsed = frontmatterSchema.safeParse(normalizeDates(data));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "frontmatter"}: ${issue.message}`);
    throw new PostError(slug, issues.join("; "));
  }
  const fm = parsed.data;
  if (fm.updated && fm.updated < fm.date) throw new PostError(slug, "updated is before date");

  return {
    slug,
    title: fm.title,
    description: fm.description,
    date: fm.date,
    updated: fm.updated ?? null,
    tags: fm.tags,
    series: fm.series ?? null,
    draft: fm.draft ?? false,
    ogTitle: fm.ogTitle ?? null,
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    body: content,
  };
}

/** Newest first; ties broken by slug so the order is stable. */
export function sortPosts<T extends PostSummary>(posts: T[]): T[] {
  return [...posts].sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
}

export function summarize(post: Post): PostSummary {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { body, ...summary } = post;
  return summary;
}
