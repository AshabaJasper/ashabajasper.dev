import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * An icon-only button says nothing to a screen reader unless it is given a
 * name. Every <Button size="icon"> must carry aria-label (or title), or hold
 * sr-only text, or wrap a child that carries the label (asChild links).
 */

const SRC = join(process.cwd(), "src");

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return name.endsWith(".tsx") ? [full] : [];
  });
}

/** Index of the ">" that closes the JSX opening tag starting at `from`. */
function endOfOpeningTag(text: string, from: number): number {
  let depth = 0;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0 && text[i - 1] !== "=") return i;
  }
  return text.length - 1;
}

function unnamedIconButtons(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const found: string[] = [];
  for (const match of text.matchAll(/<Button\b/g)) {
    const start = match.index!;
    const end = endOfOpeningTag(text, start + match[0].length);
    const tag = text.slice(start, end + 1);
    if (!tag.includes('size="icon"') || tag.endsWith("/>")) continue;
    const close = text.indexOf("</Button>", end);
    const body = text.slice(end + 1, close === -1 ? undefined : close);
    const named = /aria-label|aria-labelledby|title=/.test(tag) || /sr-only|aria-label/.test(body);
    if (!named) {
      const line = text.slice(0, start).split("\n").length;
      found.push(`${relative(process.cwd(), file).split("\\").join("/")}:${line}`);
    }
  }
  return found;
}

describe("icon-only buttons", () => {
  it("all have an accessible name", () => {
    const files = tsxFiles(SRC);
    expect(files.length).toBeGreaterThan(5);
    expect(files.flatMap(unnamedIconButtons)).toEqual([]);
  });
});
