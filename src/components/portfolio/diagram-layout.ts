/**
 * Layout for the architecture and flow diagrams on the case studies. Pure,
 * so tests can check every node fits its box and every edge has both ends.
 *
 * A diagram is a row of stages (columns on wide screens, bands stacked top
 * to bottom on phones), each holding a few nodes, and edges between nodes.
 */

export interface DiagramNode {
  id: string;
  label: string;
  sub?: string;
  /** A lucide icon key from diagram.tsx, or a simple-icons slug in `logo`. */
  icon?: string;
  logo?: string;
  accent?: boolean;
}

export interface DiagramStage {
  label: string;
  nodes: DiagramNode[];
}

export interface DiagramEdge {
  from: string;
  to: string;
}

export interface DiagramSpec {
  title: string;
  /** Plain-language account of the whole figure, for screen readers and the caption. */
  description: string;
  stages: DiagramStage[];
  edges: DiagramEdge[];
}

export interface PlacedNode extends DiagramNode {
  x: number;
  y: number;
  w: number;
  h: number;
  stage: number;
}

export interface PlacedEdge extends DiagramEdge {
  d: string;
  stage: number;
}

export interface DiagramLayout {
  width: number;
  height: number;
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  stageLabels: { label: string; x: number; y: number; anchor: "start" | "middle" }[];
}

export const NODE_H = 64;
const V_GAP = 18;
const HEAD = 36;

/** Rough text widths for Geist at the sizes the diagram uses. */
export const LABEL_CHAR = 7.4;
export const SUB_CHAR = 6.2;
/** Room taken by the icon tile and padding inside a node. */
export const TEXT_INSET = 58;

function edgePath(a: PlacedNode, b: PlacedNode, vertical: boolean): string {
  if (!vertical && a.stage !== b.stage) {
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const x2 = b.x;
    const y2 = b.y + b.h / 2;
    const dx = Math.max(24, (x2 - x1) / 2);
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  }
  // Same stage, or the phone layout: a vertical curve, or a horizontal one for side-by-side nodes.
  if (Math.abs(a.y - b.y) < 1) {
    const [l, r] = a.x < b.x ? [a, b] : [b, a];
    const y = a.y + a.h / 2;
    return `M${l.x + l.w},${y} L${r.x},${y}`;
  }
  const down = a.y < b.y;
  const x1 = a.x + a.w / 2;
  const y1 = down ? a.y + a.h : a.y;
  const x2 = b.x + b.w / 2;
  const y2 = down ? b.y : b.y + b.h;
  const dy = (y2 - y1) / 2;
  return `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
}

function placeEdges(spec: DiagramSpec, nodes: PlacedNode[], vertical: boolean): PlacedEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return spec.edges.flatMap((edge) => {
    const a = byId.get(edge.from);
    const b = byId.get(edge.to);
    if (!a || !b) return [];
    return [{ ...edge, d: edgePath(a, b, vertical), stage: Math.max(a.stage, b.stage) }];
  });
}

/** Stages as columns, left to right. */
export function layoutWide(spec: DiagramSpec): DiagramLayout {
  const n = spec.stages.length;
  const width = Math.max(1000, n * 220);
  const colW = width / n;
  const w = Math.min(212, colW - 28);
  const tallest = Math.max(...spec.stages.map((s) => s.nodes.length));
  const area = tallest * NODE_H + (tallest - 1) * V_GAP;
  const nodes: PlacedNode[] = [];
  spec.stages.forEach((stage, si) => {
    const k = stage.nodes.length;
    const top = HEAD + (area - (k * NODE_H + (k - 1) * V_GAP)) / 2;
    stage.nodes.forEach((node, ni) => {
      nodes.push({ ...node, stage: si, w, h: NODE_H, x: si * colW + (colW - w) / 2, y: top + ni * (NODE_H + V_GAP) });
    });
  });
  return {
    width,
    height: HEAD + area + 8,
    nodes,
    edges: placeEdges(spec, nodes, false),
    stageLabels: spec.stages.map((s, si) => ({ label: s.label, x: si * colW + colW / 2, y: 14, anchor: "middle" })),
  };
}

export const NARROW_W = 400;
const NARROW_GAP = 16;
const STAGE_GAP = 34;

/** Stages as bands, top to bottom, two nodes to a row. */
export function layoutNarrow(spec: DiagramSpec): DiagramLayout {
  const width = NARROW_W;
  const nodes: PlacedNode[] = [];
  const stageLabels: DiagramLayout["stageLabels"] = [];
  let y = 0;
  spec.stages.forEach((stage, si) => {
    stageLabels.push({ label: stage.label, x: 0, y: y + 12, anchor: "start" });
    y += 26;
    const k = stage.nodes.length;
    for (let row = 0; row < Math.ceil(k / 2); row++) {
      const items = stage.nodes.slice(row * 2, row * 2 + 2);
      const w = items.length === 1 ? 236 : (width - NARROW_GAP) / 2;
      items.forEach((node, i) => {
        const x = items.length === 1 ? (width - w) / 2 : i * (w + NARROW_GAP);
        nodes.push({ ...node, stage: si, w, h: NODE_H, x, y });
      });
      y += NODE_H + 12;
    }
    y += STAGE_GAP - 12;
  });
  return { width, height: y - STAGE_GAP + 8, nodes, edges: placeEdges(spec, nodes, true), stageLabels };
}

/** True when a node's label and sub-label fit inside its box at the diagram's type sizes. */
export function fits(node: Pick<PlacedNode, "label" | "sub" | "w">): boolean {
  const label = node.label.length * LABEL_CHAR + TEXT_INSET <= node.w;
  const sub = !node.sub || node.sub.length * SUB_CHAR + TEXT_INSET <= node.w;
  return label && sub;
}
