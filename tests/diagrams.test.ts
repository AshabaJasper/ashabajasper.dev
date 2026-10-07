import { describe, expect, it } from "vitest";
import { fits, layoutNarrow, layoutWide } from "@/components/portfolio/diagram-layout";
import { diagrams } from "@/data/diagrams";
import { featuredWork } from "@/data/work";

describe("case study diagrams", () => {
  it("exist for every case study", () => {
    for (const item of featuredWork()) expect(diagrams[item.slug], item.slug).toBeDefined();
  });

  it("connect only nodes that exist, and only forwards or within a stage", () => {
    for (const [slug, spec] of Object.entries(diagrams)) {
      const stageOf = new Map(spec.stages.flatMap((s, i) => s.nodes.map((n) => [n.id, i] as const)));
      expect(new Set(stageOf.keys()).size, slug).toBe(spec.stages.flatMap((s) => s.nodes).length);
      for (const edge of spec.edges) {
        expect(stageOf.has(edge.from), `${slug} ${edge.from}`).toBe(true);
        expect(stageOf.has(edge.to), `${slug} ${edge.to}`).toBe(true);
        const step = stageOf.get(edge.to)! - stageOf.get(edge.from)!;
        expect(step === 0 || step === 1, `${slug} ${edge.from} to ${edge.to}`).toBe(true);
      }
    }
  });

  it("fit every label inside its node, wide and narrow", () => {
    for (const [slug, spec] of Object.entries(diagrams)) {
      for (const layout of [layoutWide(spec), layoutNarrow(spec)]) {
        for (const node of layout.nodes) expect(fits(node), `${slug}: ${node.label} / ${node.sub}`).toBe(true);
        expect(layout.edges).toHaveLength(spec.edges.length);
      }
    }
  });

  it("describe themselves for screen readers", () => {
    for (const spec of Object.values(diagrams)) {
      expect(spec.title.length).toBeGreaterThan(10);
      expect(spec.description.length).toBeGreaterThan(80);
    }
  });
});
