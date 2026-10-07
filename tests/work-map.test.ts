import { describe, expect, it } from "vitest";
import { GROUP_BY, STACK_FAMILIES, groupWork, layoutGroups, stackFamily, workStats } from "@/components/portfolio/work-map-data";
import { work } from "@/data/work";

describe("work map grouping", () => {
  it("places every project exactly once in every grouping", () => {
    for (const { value } of GROUP_BY) {
      const slugs = groupWork(value).flatMap((g) => g.items.map((i) => i.slug));
      expect(slugs).toHaveLength(work.length);
      expect(new Set(slugs).size).toBe(work.length);
    }
  });

  it("keeps undated projects in one neutral group, last", () => {
    const groups = groupWork("year");
    const last = groups[groups.length - 1];
    expect(last.label).toBe("Also shipped");
    expect(last.items.length).toBe(work.filter((w) => w.year === null).length);
    const years = groups.slice(0, -1).map((g) => Number(g.label));
    expect([...years].sort((a, b) => b - a)).toEqual(years);
  });

  it("folds single-project sectors into one labelled group", () => {
    const groups = groupWork("sector");
    const other = groups.find((g) => g.key === "other");
    const singles = new Map<string, number>();
    for (const w of work) singles.set(w.sector, (singles.get(w.sector) ?? 0) + 1);
    const count = [...singles.values()].filter((n) => n === 1).length;
    expect(other?.label).toBe(`${count} more sectors`);
    expect(other?.items).toHaveLength(count);
  });

  it("groups by stack family, with unlisted stacks under a neutral Web group", () => {
    const groups = groupWork("stack");
    const web = groups.find((g) => g.key === "web");
    expect(web?.label).toBe("Web");
    expect(web?.items.every((w) => w.stack.length === 0)).toBe(true);
    for (const g of groups.filter((g) => g.key !== "web")) {
      const family = STACK_FAMILIES.find((f) => f.key === g.key)!;
      for (const item of g.items) expect(item.stack.some((t) => family.techs.includes(t)), item.slug).toBe(true);
    }
    expect(stackFamily({ stack: ["Flutter", "Firebase"] })).toBe("mobile");
    expect(stackFamily({ stack: ["Next.js", "React"] })).toBe("react");
  });

  it("never labels a group with an apology", () => {
    for (const { value } of GROUP_BY) {
      for (const g of groupWork(value)) expect(`${g.label} ${g.note ?? ""}`).not.toMatch(/not listed|unknown|missing/i);
    }
  });

  it("puts case studies first inside a group", () => {
    const systems = groupWork("kind").find((g) => g.key === "system")!;
    const firstPlain = systems.items.findIndex((i) => !i.featured);
    expect(systems.items.slice(firstPlain).some((i) => i.featured)).toBe(false);
  });
});

describe("work map layout", () => {
  it("keeps every mark inside the width, without overlaps", () => {
    for (const width of [280, 343, 700, 1136]) {
      const layout = layoutGroups(groupWork("kind"), width);
      expect(layout.nodes).toHaveLength(work.length);
      for (const n of layout.nodes) {
        expect(n.x).toBeGreaterThan(0);
        expect(n.x).toBeLessThan(width);
      }
      const keys = new Set(layout.nodes.map((n) => `${n.x},${n.y}`));
      expect(keys.size).toBe(work.length);
    }
  });

  it("stacks labels above the marks on narrow screens", () => {
    expect(layoutGroups(groupWork("kind"), 360).stacked).toBe(true);
    expect(layoutGroups(groupWork("kind"), 1000).stacked).toBe(false);
  });
});

describe("work stats", () => {
  it("are counted from the data", () => {
    const stats = workStats();
    expect(stats.projects).toBe(47);
    expect(stats.caseStudies).toBe(5);
    expect(stats.withYear).toBe(work.filter((w) => w.year !== null).length);
    expect(stats.technologies).toBe(new Set(work.flatMap((w) => w.stack)).size);
  });
});
