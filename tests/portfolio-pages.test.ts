import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NOT_FOUND_METADATA } from "@/components/portfolio/not-found-metadata";
import { experience } from "@/data/experience";
import { featuredWork } from "@/data/work";

const read = (rel: string) => readFileSync(join(process.cwd(), "src", "app", "portfolio", rel), "utf8");

describe("portfolio 404 metadata", () => {
  it("is a noindex page with its own title and description", () => {
    expect(NOT_FOUND_METADATA.title).toBe("Page not found");
    expect(String(NOT_FOUND_METADATA.description).length).toBeGreaterThan(40);
    expect(NOT_FOUND_METADATA.robots).toEqual({ index: false, follow: true });
  });

  it("is exported by both the not-found page and the catch-all", () => {
    // Without metadata on the catch-all the client swaps the 404 title for the layout default after hydration.
    expect(read("not-found.tsx")).toMatch(/export const metadata: Metadata = NOT_FOUND_METADATA;/);
    expect(read("[...missing]/page.tsx")).toMatch(/export const metadata: Metadata = NOT_FOUND_METADATA;/);
  });
});

describe("portfolio copy", () => {
  it("keeps case study descriptions (the summaries) near search-result length", () => {
    for (const item of featuredWork()) {
      expect(item.summary.length, item.slug).toBeLessThanOrEqual(200);
    }
  });

  it("describes Persmon the way its own site does", () => {
    // persmontechnologies.com calls itself a software company or agency, never a studio.
    const persmon = experience.find((entry) => entry.organisation === "Persmon Technologies");
    expect(persmon?.description).not.toMatch(/studio/i);
  });
});
