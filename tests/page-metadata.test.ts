import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Website standard items 2 and 3: every page sets its own title and its own
 * description. Pages that only redirect or only call notFound() are exempt,
 * because they never render a document of their own.
 */

const APP_DIR = join(process.cwd(), "src", "app");

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return pages(full);
    return name === "page.tsx" ? [full] : [];
  });
}

const EXEMPT = new Set([
  "portfolio/[...missing]/page.tsx",
  "blog/[...missing]/page.tsx",
  "admin/[...missing]/page.tsx",
  "admin/(shell)/page.tsx",
]);

const all = pages(APP_DIR).map((file) => ({
  rel: relative(APP_DIR, file).split("\\").join("/"),
  source: readFileSync(file, "utf8"),
}));

/** The metadata object literal, or the body of generateMetadata. */
function metadataBlock(source: string): string | null {
  const start = source.search(/export const metadata\b|export async function generateMetadata\b/);
  if (start === -1) return null;
  const end = source.indexOf("export default", start);
  return source.slice(start, end === -1 ? undefined : end);
}

describe("page metadata", () => {
  it("finds the pages", () => {
    expect(all.length).toBeGreaterThan(1);
  });

  it("exempt pages really are redirect-only or notFound-only", () => {
    for (const rel of EXEMPT) {
      const page = all.find((p) => p.rel === rel);
      if (!page) continue;
      expect(page.source, rel).toMatch(/redirect\(|notFound\(/);
    }
  });

  it("every page sets a title and a description of its own", () => {
    const missing = all
      .filter((p) => !EXEMPT.has(p.rel))
      .filter((p) => {
        const block = metadataBlock(p.source);
        return !block || !/\btitle\b/.test(block) || !/\bdescription\b/.test(block);
      })
      .map((p) => p.rel);
    expect(missing).toEqual([]);
  });

  it("no two static pages share a description", () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];
    for (const page of all) {
      const block = metadataBlock(page.source);
      const match = block?.match(/description:\s*\n?\s*"([^"]+)"/);
      if (!match) continue;
      const previous = seen.get(match[1]);
      if (previous) duplicates.push(`${previous} and ${page.rel}`);
      seen.set(match[1], page.rel);
    }
    expect(duplicates).toEqual([]);
  });
});
