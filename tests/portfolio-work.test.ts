import { describe, expect, it } from "vitest";
import * as cv from "@/data/cv";
import { experience, experienceMonths, experiencePeriod } from "@/data/experience";
import { featuredWork, sectors, work, workBySlug, workKinds } from "@/data/work";

const EM_DASH = String.fromCharCode(0x2014);
const FEATURED_ORDER = [
  "hms",
  "oms",
  "uganda-bookshop",
  "pearl-insights",
  "sickle-cell-awards-voting",
];

describe("portfolio work data", () => {
  it("has all 47 Persmon projects", () => {
    expect(work).toHaveLength(47);
    const byKind = Object.fromEntries(workKinds.map(({ kind }) => [kind, work.filter((w) => w.kind === kind).length]));
    // Persmon lists 6 systems, 35 websites, 3 online shops and 3 mobile apps.
    expect(byKind).toEqual({ system: 6, website: 35, ecommerce: 3, mobile: 3 });
  });

  it("uses unique kebab-case slugs and unique order values", () => {
    const slugs = work.map((w) => w.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    expect(new Set(work.map((w) => w.order)).size).toBe(work.length);
  });

  it("features exactly five projects, in the agreed order, each with a case study", () => {
    expect(work.filter((w) => w.featured)).toHaveLength(5);
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
    for (const item of featured) {
      expect(item.caseStudy.role).toBe("Built at Persmon Technologies");
    }
  });

  it("only gives case studies to featured work", () => {
    expect(work.filter((w) => !w.featured && w.caseStudy)).toEqual([]);
  });

  it("uses https URLs or null, and null for mobile and internal work", () => {
    for (const item of work) {
      if (item.url !== null) expect(() => new URL(item.url!)).not.toThrow();
      if (item.url !== null) expect(item.url, item.slug).toMatch(/^https:\/\//);
      if (item.kind === "mobile") expect(item.url, item.slug).toBeNull();
    }
    expect(workBySlug("persmon-ems")?.url).toBeNull();
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
    expect(sectors.reduce((sum, s) => sum + s.count, 0)).toBe(47);
    expect(new Set(sectors.map((s) => s.slug)).size).toBe(sectors.length);
  });

  it("carries the CV history with dated entries and an undated current COO role", () => {
    expect(experience[0].id).toBe("persmon");
    expect(experience[0].start).toBeNull();
    expect(experiencePeriod(experience[0])).toBe("Present");
    const byId = Object.fromEntries(experience.map((e) => [e.id, e]));
    expect(experiencePeriod(byId.reveloop)).toBe("Feb 2025 to Jun 2026");
    expect(experiencePeriod(byId["excellent-shop"])).toBe("Feb 2024 to Jan 2025");
    expect(experiencePeriod(byId["uganda-bookshop"])).toBe("May 2023 to Aug 2024");
    expect(experiencePeriod(byId["centenary-publishing"])).toBe("Aug 2023 to Apr 2024");
    expect(experiencePeriod(byId["blue-pearls"])).toBe("Apr 2021 to Jun 2024");
    expect(experiencePeriod(byId["mtn-uganda"])).toBe("Jul 2023 to Sep 2023");
    expect(experiencePeriod(byId.decades)).toBe("Sep 2019 to Feb 2021");
    expect(experiencePeriod(byId.learnnovate)).toBe("Dec 2022 to present");
    expect(experiencePeriod(byId["radiant-smile"])).toBe("Jun 2023 to present");
    expect(experiencePeriod(byId.ucu)).toBe("Jan 2022 to Jul 2024");
    expect(byId.ucu.role).toContain("4.62/5.0");
    expect(new Set(experience.map((e) => e.id)).size).toBe(experience.length);
  });

  it("counts months inclusively and leaves unknown starts unknown", () => {
    const now = { year: 2026, month: 10 };
    expect(experienceMonths(experience[0], now)).toBeNull();
    expect(experienceMonths({ start: { year: 2023, month: 7 }, end: { year: 2023, month: 9 } }, now)).toBe(3);
    expect(experienceMonths({ start: { year: 2026, month: 1 }, end: "present" }, now)).toBe(10);
  });

  it("never publishes CV phone numbers or referees", () => {
    const text = JSON.stringify({ experience, cv });
    expect(text).not.toMatch(/\+256|\d{3} \d{3} \d{3}/);
    expect(text).not.toMatch(/Karibwije|Indibatya/);
  });
});
