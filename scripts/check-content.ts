/**
 * Content check for content/posts/*.mdx. Runs before every build (npm
 * prebuild) and on demand: npx tsx scripts/check-content.ts
 *
 * Fails (exit 1) on schema errors, reserved or duplicate slugs, em dashes,
 * descriptions over 200 characters, a series part used twice, components
 * other than <Note>, and MDX that does not compile. Prints one line per post.
 * Exits 0 with a note when there are no posts yet.
 *
 * The MDX compile mirrors src/lib/content/mdx.tsx (remark-gfm, JS expressions
 * blocked). That module is server-only and cannot be imported from a script.
 * The MDX packages are ESM only and this repo is CommonJS by default, so they
 * are loaded with dynamic import().
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parsePost, type Post } from "../src/lib/content/parse";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");
const EM_DASH = String.fromCharCode(0x2014);
const ALLOWED_COMPONENTS = new Set(["Note"]);

/** JSX component names used outside fenced and inline code. */
function componentsUsed(body: string): string[] {
  const prose = body.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "").replace(/`[^`\n]*`/g, "");
  return [...new Set([...prose.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((match) => match[1]))];
}

async function compiles(body: string): Promise<string | null> {
  const [{ serialize }, { default: remarkGfm }] = await Promise.all([
    import("next-mdx-remote/serialize"),
    import("remark-gfm"),
  ]);
  try {
    await serialize(body, { blockJS: true, mdxOptions: { remarkPlugins: [remarkGfm] } });
    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // next-mdx-remote adds a header line and a code frame; keep the reason.
    const lines = message
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const reason = lines.find((line) => !line.startsWith("[next-mdx-remote]") && !/^>?\s*\d*\s*\|/.test(line));
    return reason ?? lines[0] ?? "unknown error";
  }
}

async function main(): Promise<number> {
  let names: string[];
  try {
    names = readdirSync(POSTS_DIR);
  } catch {
    names = [];
  }
  const files = names.filter((name) => name.endsWith(".mdx") || name.endsWith(".md"));
  if (files.length === 0) {
    console.log("check-content: no posts in content/posts yet, nothing to check.");
    return 0;
  }

  const problems: string[] = [];
  const posts: Post[] = [];
  const slugs = new Map<string, string>();

  for (const name of files.sort()) {
    const file = `content/posts/${name}`;
    if (!name.endsWith(".mdx")) {
      problems.push(`${file}: posts must use the .mdx extension`);
      continue;
    }
    const slug = name.slice(0, -4);
    const lower = slug.toLowerCase();
    if (slugs.has(lower)) problems.push(`${file}: duplicate slug, also used by ${slugs.get(lower)}`);
    slugs.set(lower, file);

    const source = readFileSync(path.join(POSTS_DIR, name), "utf8");
    if (source.includes(EM_DASH)) {
      const lines = source
        .split("\n")
        .map((line, i) => (line.includes(EM_DASH) ? i + 1 : 0))
        .filter(Boolean);
      problems.push(`${file}: em dash on line ${lines.join(", ")}; use a comma, a colon or a new sentence`);
    }

    // The body is checked even when the frontmatter is wrong, so one run lists everything.
    const body = matter(source).content;
    const unknown = componentsUsed(body).filter((name) => !ALLOWED_COMPONENTS.has(name));
    if (unknown.length > 0) {
      problems.push(`${file}: unknown component ${unknown.map((n) => `<${n}>`).join(", ")}; only <Note> is available`);
    }
    const compileError = await compiles(body);
    if (compileError) problems.push(`${file}: MDX does not compile: ${compileError}`);

    let post: Post;
    try {
      post = parsePost(slug, source);
    } catch (err) {
      problems.push(err instanceof Error ? err.message : String(err));
      continue;
    }
    if (post.description.length > 200) {
      problems.push(`${file}: description is ${post.description.length} characters, the limit is 200`);
    }

    posts.push(post);
  }

  const parts = new Map<string, string>();
  for (const post of posts) {
    if (!post.series) continue;
    const key = `${post.series.name}#${post.series.part}`;
    const other = parts.get(key);
    if (other) {
      problems.push(`content/posts/${post.slug}.mdx: "${post.series.name}" part ${post.series.part} is also used by ${other}`);
    }
    parts.set(key, `content/posts/${post.slug}.mdx`);
  }

  for (const post of posts) {
    const flags = [post.draft ? "draft" : null, post.series ? `${post.series.name} ${post.series.part}` : null]
      .filter(Boolean)
      .join(", ");
    console.log(
      `  ${post.date}  ${post.slug}  (${post.readingMinutes} min, ${post.tags.join(" ")}${flags ? `, ${flags}` : ""})`,
    );
  }

  if (problems.length > 0) {
    console.error(`\ncheck-content: ${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    return 1;
  }
  console.log(`check-content: ${posts.length} post${posts.length === 1 ? "" : "s"} OK.`);
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
