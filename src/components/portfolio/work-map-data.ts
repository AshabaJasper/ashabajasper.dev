import { allWork, workKinds, type WorkItem, type WorkKind } from "@/data/work";

/**
 * Grouping and layout for the work map: one mark per real project, grouped
 * by kind, sector or year. Pure, so tests can check that every project is
 * placed exactly once and that unknown years stay visible as their own group.
 */

export type GroupBy = "kind" | "sector" | "year";

export const GROUP_BY: readonly { value: GroupBy; label: string }[] = [
  { value: "kind", label: "Kind" },
  { value: "sector", label: "Sector" },
  { value: "year", label: "Year" },
];

export interface MapGroup {
  key: string;
  label: string;
  /** A second line under the label, for example the sectors folded into "Other". */
  note?: string;
  items: WorkItem[];
}

/** Case studies first, then the usual display order. */
function ordered(items: WorkItem[]): WorkItem[] {
  return [...items].sort((a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order);
}

export function groupWork(by: GroupBy, items: readonly WorkItem[] = allWork()): MapGroup[] {
  if (by === "kind") {
    return workKinds
      .map(({ kind, label }) => ({ key: kind, label, items: ordered(items.filter((w) => w.kind === kind)) }))
      .filter((g) => g.items.length > 0);
  }

  if (by === "year") {
    const years = [...new Set(items.map((w) => w.year).filter((y): y is number => y !== null))].sort((a, b) => b - a);
    const groups: MapGroup[] = years.map((year) => ({
      key: String(year),
      label: String(year),
      items: ordered(items.filter((w) => w.year === year)),
    }));
    const unknown = items.filter((w) => w.year === null);
    // Missing years are a gap in the source listing, shown as their own group rather than hidden.
    if (unknown.length > 0) groups.push({ key: "unknown", label: "Year not listed", items: ordered(unknown) });
    return groups;
  }

  const bySector = new Map<string, WorkItem[]>();
  for (const item of items) bySector.set(item.sector, [...(bySector.get(item.sector) ?? []), item]);
  const sorted = [...bySector.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const shared = sorted.filter(([, list]) => list.length > 1);
  const single = sorted.filter(([, list]) => list.length === 1);
  const groups: MapGroup[] = shared.map(([sector, list]) => ({ key: sector, label: sector, items: ordered(list) }));
  if (single.length > 0) {
    groups.push({
      key: "other",
      label: `${single.length} more sectors`,
      note: "One project each",
      items: ordered(single.map(([, list]) => list[0])),
    });
  }
  return groups;
}

export interface LayoutNode {
  slug: string;
  x: number;
  y: number;
  group: string;
  /** Position inside its group, for keyboard movement between rows. */
  index: number;
}

export interface LayoutLabel {
  key: string;
  label: string;
  note?: string;
  count: number;
  x: number;
  y: number;
}

export interface MapLayout {
  nodes: LayoutNode[];
  labels: LayoutLabel[];
  rows: { key: string; y: number; height: number }[];
  width: number;
  height: number;
  /** Labels sit beside the marks from this width up, above them below it. */
  stacked: boolean;
  /** Distance between mark centres: larger on wide screens. */
  step: number;
}

export const STEP = 28;
const WIDE_STEP = 36;
const LABEL_WIDTH = 200;
const ROW_GAP = 18;
const STACKED_LABEL = 38;

export function layoutGroups(groups: readonly MapGroup[], width: number): MapLayout {
  const stacked = width < 640;
  const step = width >= 900 ? WIDE_STEP : STEP;
  const left = stacked ? 0 : LABEL_WIDTH;
  const columns = Math.max(4, Math.floor((width - left) / step));
  const nodes: LayoutNode[] = [];
  const labels: LayoutLabel[] = [];
  const rows: MapLayout["rows"] = [];
  let y = 0;

  for (const group of groups) {
    const top = y;
    const lines = Math.max(1, Math.ceil(group.items.length / columns));
    const labelBlock = stacked ? STACKED_LABEL : 0;
    labels.push({ key: group.key, label: group.label, note: group.note, count: group.items.length, x: 0, y: top });
    group.items.forEach((item, i) => {
      nodes.push({
        slug: item.slug,
        group: group.key,
        index: i,
        x: left + (i % columns) * step + step / 2,
        y: top + labelBlock + Math.floor(i / columns) * step + step / 2,
      });
    });
    const height = Math.max(labelBlock + lines * step, stacked ? 0 : group.note ? 44 : step);
    rows.push({ key: group.key, y: top, height });
    y += height + ROW_GAP;
  }

  return { nodes, labels, rows, width, height: Math.max(step, y - ROW_GAP), stacked, step };
}

/** Headline counts for the map, all derived from the data. */
export function workStats(items: readonly WorkItem[] = allWork()) {
  const techs = new Set(items.flatMap((w) => w.stack));
  return {
    projects: items.length,
    kinds: new Set(items.map((w) => w.kind)).size,
    sectors: new Set(items.map((w) => w.sector)).size,
    withYear: items.filter((w) => w.year !== null).length,
    withStack: items.filter((w) => w.stack.length > 0).length,
    technologies: techs.size,
    caseStudies: items.filter((w) => w.featured).length,
  };
}

export const KIND_SHAPE: Record<WorkKind, "square" | "circle" | "diamond" | "triangle"> = {
  system: "square",
  website: "circle",
  ecommerce: "diamond",
  mobile: "triangle",
};
