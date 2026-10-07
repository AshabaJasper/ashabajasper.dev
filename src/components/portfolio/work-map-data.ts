import { allWork, workKinds, type WorkItem, type WorkKind } from "@/data/work";
import { stackCounts } from "@/components/portfolio/terminal-commands";

/**
 * Grouping and layout for the work map: one mark per real project, grouped
 * by kind, sector, year or stack. Pure, so tests can check that every project
 * is placed exactly once. Projects without a listed year or stack sit in a
 * neutral group of their own; nothing is guessed.
 */

export type GroupBy = "kind" | "sector" | "year" | "stack";

export const GROUP_BY: readonly { value: GroupBy; label: string }[] = [
  { value: "kind", label: "Kind" },
  { value: "sector", label: "Sector" },
  { value: "year", label: "Year" },
  { value: "stack", label: "Stack" },
];

/**
 * Stack families, tested in this order, so each project lands in exactly one.
 * `logos` are simple-icons slugs drawn beside the group label.
 */
export const STACK_FAMILIES: readonly { key: string; label: string; logos: string[]; techs: string[] }[] = [
  { key: "mobile", label: "Flutter and native mobile", logos: ["flutter", "android", "apple"], techs: ["Flutter", "React Native", "Android", "iOS"] },
  { key: "react", label: "React and Next.js", logos: ["nextdotjs", "react", "typescript"], techs: ["Next.js", "React", "Vite"] },
  { key: "php", label: "PHP and MySQL", logos: ["php", "mysql"], techs: ["PHP 8", "PHP", "MySQL"] },
  { key: "wordpress", label: "WordPress and WooCommerce", logos: ["wordpress", "woocommerce"], techs: ["WordPress", "WooCommerce"] },
  {
    key: "html",
    label: "HTML, CSS and JavaScript",
    logos: ["html5", "css", "javascript", "bootstrap"],
    techs: ["HTML", "CSS", "JavaScript", "Bootstrap", "jQuery", "Tailwind CSS"],
  },
];

/** The family a project's stack belongs to, or "web" when the listing names none. */
export function stackFamily(item: Pick<WorkItem, "stack">): string {
  return STACK_FAMILIES.find((f) => item.stack.some((t) => f.techs.includes(t)))?.key ?? "web";
}

export interface MapGroup {
  key: string;
  label: string;
  /** A second line under the label, for example the sectors folded into "Other". */
  note?: string;
  /** The sector names folded into this group, for its icons. */
  sectors?: string[];
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
    const rest = items.filter((w) => w.year === null);
    // Undated projects stay on the map in a neutral group of their own; no year is guessed.
    if (rest.length > 0) groups.push({ key: "more", label: "Also shipped", items: ordered(rest) });
    return groups;
  }

  if (by === "stack") {
    const groups: MapGroup[] = STACK_FAMILIES.map((f) => ({
      key: f.key,
      label: f.label,
      items: ordered(items.filter((w) => stackFamily(w) === f.key)),
    })).filter((g) => g.items.length > 0);
    const web = items.filter((w) => stackFamily(w) === "web");
    if (web.length > 0) groups.push({ key: "web", label: "Web", items: ordered(web) });
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
      sectors: single.map(([sector]) => sector),
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

export const STEP = 38;
const WIDE_STEP = 46;
const LABEL_WIDTH = 272;
const ROW_GAP = 22;
const STACKED_LABEL = 50;

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
    const height = Math.max(labelBlock + lines * step, stacked ? 0 : 58);
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

/** Technologies named by at least three projects, offered as map highlights; every stack is in the table. */
export const MAP_TECHS = stackCounts(allWork()).filter((c) => c.count >= 3);
