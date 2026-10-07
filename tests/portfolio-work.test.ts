import { describe, expect, it } from "vitest";
import { experience, experienceYears } from "@/data/experience";
import { featuredWork, sectors, work, workBySlug, workKinds } from "@/data/work";

const EM_DASH = String.fromCharCode(0x2014);
const FEATURED_ORDER = [
  "jasper-os",
  "hms",
  "oms",
  "uganda-bookshop",
  "pearl-insights",
  "sickle-cell-awards-voting",
];

describe("portfolio work data", () => {
  it("has all 47 Persmon projects plus Jasper OS", () => {
    expect(work).toHaveLength(48);
    const byKind = Object.fromEntries(workKinds.map(({ kind }) => [kind, work.filter((w) => w.kind === kind).length]));
    // Persmon lists 6 systems, 35 websites, 3 online shops and 3 mobile apps; Jasper OS is one more system.
    expect(byKind).toEqual({ system: 7, website: 35, ecommerce: 3, mobile: 3 });
  });

  it("uses unique kebab-case slugs and unique order values", () => {
    const slugs = work.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(new Set(work.map((w) => w.order)).size).toBe(work.length);
  });

  it("features exactly six projects, in the agreed order, each with a case study", () => {
    expect(work.filter((w) => w.featured)).toHaveLength(6);
    const featured = featuredWork();
    expect(featured.map((w) => w.slug)).toEqual(FEATURED_ORDER);
    for (const item of featured) {
      const study = item.caseStudy;
      expect(study.headline.length).toBeGreaterThan(10);
      expect(study.built.length).toBeGreaterThanOrEqual(4);
      expect(study.built.length).toBeLessThanOrEqual(6);
      expect(study.stack.length).toBeGreaterThan(0);
      expect(study.links.length).toBeGreaterThan(0);
      const sentences = study.context.split(/(?<=\.)\s+/).filter(Boolean);
      expect(sentences.length, item.slug).toBeGreaterThanOrEqual(2);
      expect(sentences.length, item.slug).toBeLessThanOrEqual(3);
    }
    expect(workBySlug("jasper-os")?.caseStudy?.role).toBe("Designed and built, solo");
    for (const item of featured.filter((w) => w.slug !== "jasper-os")) {
      expect(item.caseStudy.role).toBe("Built at Persmon Technologies");
    }
  });

  it("only gives case studies to featured work", () => {
    expect(work.filter((w) => !w.featured && w.caseStudy)).toEqual([]);
  });

  it("uses https URLs or null, and null for mobile and private work", () => {
    for (const item of work) {
      if (item.url !== null) expect(() => new URL(item.url!)).not.toThrow();
      if (item.url !== null) expect(item.url, item.slug).toMatch(/^https:\/\//);
      if (item.kind === "mobile") expect(item.url, item.slug).toBeNull();
    }
    expect(workBySlug("jasper-os")?.url).toBeNull();
    expect(workBySlug("persmon-ems")?.url).toBeNull();
  });

  it("links Jasper OS to blog posts by path, never to an internal prefix", () => {
    const links = workBySlug("jasper-os")!.caseStudy!.links;
    for (const link of links) {
      expect(link.site).toBe("blog");
      expect(link.href).toMatch(/^\/[a-z0-9-]+$/);
    }
  });

  it("has no em dashes, no unknown-year zeros and no '+N more' stack entries", () => {
    const text = JSON.stringify({ work, experience });
    expect(text.includes(EM_DASH)).toBe(false);
    for (const item of work) {
      expect(item.year === null || (item.year >= 2015 && item.year <= 2026), item.slug).toBe(true);
      for (const tech of item.stack) expect(tech).not.toMatch(/more$/);
      expect(item.summary.trim().endsWith("."), item.slug).toBe(true);
    }
  });

  it("derives sectors that cover every item", () => {
    expect(sectors.reduce((sum, s) => sum + s.count, 0)).toBe(48);
    expect(new Set(sectors.map((s) => s.slug)).size).toBe(sectors.length);
  });

  it("renders experience without years while they are unknown", () => {
    expect(experience).toHaveLength(3);
    for (const entry of experience) expect(experienceYears(entry)).toBeNull();
    expect(experienceYears({ ...experience[0], startYear: 2023, endYear: null })).toBe("2023 to now");
  });
});
