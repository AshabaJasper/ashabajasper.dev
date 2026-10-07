import { z } from "zod";

/**
 * Blog post frontmatter. Pure: shared by the loader, scripts/check-content.ts
 * and the tests. No `.default()` and no `z.coerce`: the loader fills absent
 * optional values in code.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Paths at the blog root that a post slug may never take. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "tags",
  "feed.xml",
  "robots.txt",
  "sitemap.xml",
  "og",
  "api",
  "page",
]);

export const frontmatterSchema = z
  .object({
    title: z.string().min(1).max(90),
    /** Meta description and list excerpt. */
    description: z.string().min(20).max(200),
    /** Publication date, YYYY-MM-DD. */
    date: z.string().regex(ISO_DATE, "Use YYYY-MM-DD"),
    /** Last meaningful update, YYYY-MM-DD. */
    updated: z.string().regex(ISO_DATE, "Use YYYY-MM-DD").optional(),
    tags: z.array(z.string().regex(SLUG_PATTERN, "Tags are kebab-case")).min(1).max(6),
    series: z
      .object({
        name: z.string().min(1).max(60),
        part: z.number().int().positive(),
      })
      .optional(),
    /** Drafts load in development only. */
    draft: z.boolean().optional(),
    /** A shorter title for the social card. */
    ogTitle: z.string().min(1).max(60).optional(),
  })
  .strict();

export type Frontmatter = z.infer<typeof frontmatterSchema>;

/** Why a filename slug is not allowed, or null. */
export function slugProblem(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) return "Slugs are lower-case kebab-case";
  if (RESERVED_SLUGS.has(slug)) return `"${slug}" is reserved`;
  return null;
}
