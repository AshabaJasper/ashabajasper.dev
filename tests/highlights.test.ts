import { describe, expect, it } from "vitest";
import { firstShipped, highlights, yearsShipping } from "@/data/highlights";
import { sectors, work } from "@/data/work";

describe("by the numbers", () => {
  const now = { year: 2026, month: 10 };

  it("counts projects and sectors from the data", () => {
    const byId = new Map(highlights(now).map((h) => [h.id, h]));
    expect(byId.get("projects")?.value).toBe(work.length);
    expect(byId.get("sectors")?.value).toBe(sectors.length);
  });

  it("measures years shipping from the first role in the CV", () => {
    expect(firstShipped()).toEqual({ year: 2019, month: 9 });
    expect(yearsShipping(now)).toBe(7);
    expect(yearsShipping({ year: 2026, month: 8 })).toBe(6);
  });

  it("quotes the CV figures with their source", () => {
    const byId = new Map(highlights(now).map((h) => [h.id, h]));
    expect(byId.get("accuracy")).toMatchObject({ value: 97.9, suffix: "%" });
    expect(byId.get("accuracy")?.source).toMatch(/RadCareLoop/);
    expect(byId.get("users")).toMatchObject({ value: 270, suffix: "+" });
    expect(byId.get("gdsc")).toMatchObject({ value: 100, suffix: "+" });
    expect(byId.get("learners")).toMatchObject({ value: 200, suffix: "+" });
    for (const h of highlights(now)) expect(h.source.length).toBeGreaterThan(3);
  });
});
