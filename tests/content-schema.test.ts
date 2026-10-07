import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parsePost, PostError, sortPosts } from "@/lib/content/parse";
import { frontmatterSchema, slugProblem } from "@/lib/content/schema";

const FIXTURES = join(process.cwd(), "tests", "fixtures", "posts");

function post(frontmatter: string, body = "## Hello\n\nBody text."): string {
  return `---\n${frontmatter.trim()}\n---\n\n${body}\n`;
}

const VALID = `
title: A valid post
description: "A description that is long enough to pass the schema."
date: "2026-09-01"
tags: [testing]
`;

describe("post frontmatter", () => {
  it("parses a valid post and fills optional values in code", () => {
    const parsed = parsePost("a-valid-post", post(VALID));
    expect(parsed).toMatchObject({
      slug: "a-valid-post",
      title: "A valid post",
      date: "2026-09-01",
      updated: null,
      series: null,
      draft: false,
      ogTitle: null,
      tags: ["testing"],
    });
    expect(parsed.readingMinutes).toBeGreaterThanOrEqual(1);
    expect(parsed.body).toContain("## Hello");
  });

  it("parses the engine fixture with series, updated and unquoted YAML dates", () => {
    const parsed = parsePost("engine-fixture", readFileSync(join(FIXTURES, "engine-fixture.mdx"), "utf8"));
    expect(parsed.series).toEqual({ name: "Fixture Series", part: 1 });
    expect(parsed.date).toBe("2026-09-01");
    expect(parsed.updated).toBe("2026-09-15");
  });

  it("normalises a YAML Date to YYYY-MM-DD", () => {
    const parsed = parsePost("yaml-date", post(VALID.replace('date: "2026-09-01"', "date: 2026-09-01")));
    expect(parsed.date).toBe("2026-09-01");
  });

  it("rejects a missing description", () => {
    expect(() => parsePost("no-description", post(VALID.replace(/description:.*\n/, "")))).toThrow(/description/);
  });

  it("rejects a bad date", () => {
    expect(() => parsePost("bad-date", post(VALID.replace('"2026-09-01"', '"1 September 2026"')))).toThrow(/date/);
  });

  it("rejects an update before the publication date", () => {
    expect(() => parsePost("backwards", post(`${VALID}\nupdated: "2026-08-01"`))).toThrow(/updated is before date/);
  });

  it("rejects more than six tags", () => {
    expect(() => parsePost("many-tags", post(VALID.replace("[testing]", "[a, b, c, d, e, f, g]")))).toThrow(/tags/);
  });

  it("rejects tags that are not kebab-case", () => {
    expect(() => parsePost("bad-tag", post(VALID.replace("[testing]", '["Not Kebab"]')))).toThrow(/kebab-case/);
  });

  it("rejects a reserved slug", () => {
    expect(slugProblem("tags")).toMatch(/reserved/);
    expect(() => parsePost("feed.xml", post(VALID))).toThrow(PostError);
    expect(() => parsePost("og", post(VALID))).toThrow(/reserved/);
  });

  it("rejects a slug that is not kebab-case", () => {
    expect(() => parsePost("Bad_Slug", post(VALID))).toThrow(/kebab-case/);
  });

  it("rejects unknown keys because the schema is strict", () => {
    expect(() => parsePost("unknown-key", post(`${VALID}\nauthor: Someone`))).toThrow(/author|Unrecognized/i);
    expect(frontmatterSchema.safeParse({ title: "x", description: "y".repeat(30), date: "2026-01-01", tags: ["a"], extra: 1 }).success).toBe(
      false,
    );
  });

  it("rejects a description over 200 characters", () => {
    expect(() => parsePost("long", post(VALID.replace(/description:.*\n/, `description: "${"x".repeat(201)}"\n`)))).toThrow(
      /description/,
    );
  });

  it("sorts newest first with a stable tie-break", () => {
    const a = parsePost("a", post(VALID));
    const b = parsePost("b", post(VALID));
    const c = parsePost("c", post(VALID.replace("2026-09-01", "2026-09-30")));
    expect(sortPosts([b, a, c]).map((p) => p.slug)).toEqual(["c", "a", "b"]);
  });
});
