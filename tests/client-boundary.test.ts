import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A "use client" file must never reach server-only code through its VALUE
 * imports. When it does, the production build tries to bundle things like
 * prisma or nodemailer for the browser and fails on `fs`, `net` or
 * `child_process`, with no import trace to say why. This walks the import
 * graph the way the bundler does:
 *   - `import type` and `{ type X }`-only imports are erased, so they are skipped
 *   - a "use server" file becomes a reference on the client, so the walk stops there
 */

const SRC = resolve(__dirname, "../src");
const SERVER_ONLY = [
  "nodemailer",
  "@prisma/client",
  "@/lib/prisma",
  "@/lib/auth",
  "@/lib/og",
  "@/lib/mail/send",
  "server-only",
  "bcryptjs",
  "next/cache",
  "fs",
  "net",
  "dns",
  "tls",
  "crypto",
  "child_process",
];

const IMPORT_RE = /^\s*(?:import|export)\s+(type\s+)?([^;]*?)\s+from\s+"([^"]+)"/gm;
const SIDE_EFFECT_RE = /^\s*import\s+"([^"]+)"/gm;

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return listFiles(full);
    return /\.tsx?$/.test(name) ? [full] : [];
  });
}

function resolveImport(spec: string, importer: string): string | null {
  const base = spec.startsWith("@/")
    ? join(SRC, spec.slice(2))
    : spec.startsWith(".")
      ? normalize(join(dirname(importer), spec))
      : null;
  if (!base) return null;
  for (const candidate of [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function valueImports(text: string): string[] {
  const specs: string[] = [];
  for (const match of text.matchAll(IMPORT_RE)) {
    const [, isType, names, spec] = match;
    if (isType) continue;
    const braces = /\{([^}]*)\}/.exec(names);
    const hasDefaultOrNamespace = /^[\s\w$*]+,/.test(names) || !braces;
    if (braces && !hasDefaultOrNamespace) {
      const specifiers = braces[1].split(",").map((s) => s.trim()).filter(Boolean);
      if (specifiers.length > 0 && specifiers.every((s) => s.startsWith("type "))) continue;
    }
    specs.push(spec);
  }
  for (const match of text.matchAll(SIDE_EFFECT_RE)) specs.push(match[1]);
  return specs;
}

// Each file is read and parsed once, however many client components reach it.
const parsed = new Map<string, { isServerAction: boolean; specs: string[] }>();
function parse(path: string) {
  let entry = parsed.get(path);
  if (!entry) {
    const text = readFileSync(path, "utf8");
    entry = { isServerAction: text.trimStart().startsWith('"use server"'), specs: valueImports(text) };
    parsed.set(path, entry);
  }
  return entry;
}

function findServerImport(start: string): string[] | null {
  const seen = new Set<string>();
  const stack: { path: string; trail: string[] }[] = [{ path: start, trail: [start] }];
  while (stack.length > 0) {
    const { path, trail } = stack.pop()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const file = parse(path);
    if (path !== start && file.isServerAction) continue;
    for (const spec of file.specs) {
      if (SERVER_ONLY.includes(spec) || spec.startsWith("node:")) return [...trail, spec];
      const target = resolveImport(spec, path);
      if (target && !seen.has(target)) stack.push({ path: target, trail: [...trail, target] });
    }
  }
  return null;
}

describe("client and server boundary", () => {
  const clientFiles = listFiles(SRC).filter((file) => readFileSync(file, "utf8").slice(0, 200).includes('"use client"'));

  it("finds the client components", () => {
    expect(clientFiles.length).toBeGreaterThan(2);
  });

  it("never lets a client component reach server-only code through value imports", () => {
    const offenders = clientFiles
      .map((file) => findServerImport(file))
      .filter((trail): trail is string[] => trail !== null)
      .map((trail) => trail.map((step) => step.replace(`${SRC}\\`, "").replace(`${SRC}/`, "")).join("\n    -> "));
    expect(offenders, `\n${offenders.join("\n\n")}\n`).toEqual([]);
    // Walks a few hundred files; generous so a busy machine never makes it flaky.
  }, 30_000);
});
