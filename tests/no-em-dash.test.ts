import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * House rule: no em dashes anywhere, in code, comments, copy, posts or docs.
 * Use a comma, a colon or a new sentence instead.
 */

const ROOT = process.cwd();
const EM_DASH = String.fromCharCode(0x2014);
const SCAN = ["src", "content", "docs", "scripts", "prisma", "tests"];
const FILES = ["README.md", "DESIGN.md", "DEPLOYMENT.md", "CLAUDE.md", ".env.example"];
const EXTENSIONS = /\.(ts|tsx|mdx|md|css|json|mjs|prisma|sql|yml|yaml)$/;

function walk(dir: string): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  return names.flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full);
    return EXTENSIONS.test(name) ? [full] : [];
  });
}

describe("no em dashes", () => {
  it("appear in source, content or docs", { timeout: 30_000 }, () => {
    const files = [
      ...SCAN.flatMap((dir) => walk(join(ROOT, dir))),
      ...FILES.map((name) => join(ROOT, name)).filter((file) => {
        try {
          return statSync(file).isFile();
        } catch {
          return false;
        }
      }),
    ];
    expect(files.length).toBeGreaterThan(10);
    const offenders = files
      .filter((file) => readFileSync(file, "utf8").includes(EM_DASH))
      .map((file) => relative(ROOT, file).split("\\").join("/"));
    expect(offenders).toEqual([]);
  });
});
