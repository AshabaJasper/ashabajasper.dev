import {
  BadgeCheck,
  Banknote,
  BedDouble,
  BookOpen,
  Boxes,
  Building2,
  CalendarCheck,
  ChartColumn,
  ClipboardCheck,
  Code,
  CreditCard,
  Fingerprint,
  Gauge,
  Globe,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Lock,
  MapPin,
  Package,
  PenLine,
  Receipt,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  SquareTerminal,
  UserRound,
  Users,
  Utensils,
  Vote,
  WifiOff,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { logoBySlug } from "@/components/portfolio/tech";
import { layoutNarrow, layoutWide, type DiagramLayout, type DiagramSpec, type PlacedNode } from "@/components/portfolio/diagram-layout";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  key: KeyRound,
  utensils: Utensils,
  bed: BedDouble,
  calendar: CalendarCheck,
  receipt: Receipt,
  wrench: Wrench,
  book: BookOpen,
  phone: Smartphone,
  cash: Banknote,
  users: Users,
  user: UserRound,
  board: LayoutDashboard,
  badge: BadgeCheck,
  gauge: Gauge,
  shield: ShieldCheck,
  search: Search,
  wifi: WifiOff,
  cart: ShoppingCart,
  card: CreditCard,
  package: Package,
  boxes: Boxes,
  pin: MapPin,
  landmark: Landmark,
  building: Building2,
  chart: ChartColumn,
  code: Code,
  globe: Globe,
  terminal: SquareTerminal,
  vote: Vote,
  sliders: SlidersHorizontal,
  clipboard: ClipboardCheck,
  fingerprint: Fingerprint,
  lock: Lock,
  pen: PenLine,
};

function NodeGlyph({ node }: { node: PlacedNode }) {
  const x = node.x + 12;
  const y = node.y + node.h / 2 - 15;
  const logo = node.logo ? logoBySlug(node.logo) : null;
  const Icon = node.icon ? ICONS[node.icon] : undefined;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={30}
        height={30}
        rx={9}
        fill={node.accent ? "var(--primary)" : "var(--accent)"}
        stroke={node.accent ? "none" : "color-mix(in srgb, var(--primary) 25%, transparent)"}
      />
      {logo ? (
        <svg x={x + 7} y={y + 7} width={16} height={16} viewBox="0 0 24 24" fill={node.accent ? "var(--primary-foreground)" : "var(--primary)"}>
          <path d={logo.path} />
        </svg>
      ) : Icon ? (
        <Icon x={x + 7} y={y + 7} width={16} height={16} strokeWidth={2} color={node.accent ? "var(--primary-foreground)" : "var(--primary)"} />
      ) : null}
    </g>
  );
}

function Figure({ layout, idPrefix, title, description, className }: { layout: DiagramLayout; idPrefix: string; title: string; description: string; className?: string }) {
  return (
    <svg
      viewBox={`-6 -6 ${layout.width + 12} ${layout.height + 12}`}
      width="100%"
      role="img"
      aria-labelledby={`${idPrefix}-title`}
      className={cn("block h-auto overflow-visible", className)}
    >
      <title id={`${idPrefix}-title`}>{title}</title>
      <desc id={`${idPrefix}-desc`}>{description}</desc>
      <defs>
        <marker id={`${idPrefix}-arrow`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,1 L9,5 L0,9 z" fill="var(--primary)" />
        </marker>
      </defs>

      {layout.stageLabels.map((s) => (
        <text
          key={`${s.label}-${s.y}`}
          x={s.x}
          y={s.y}
          textAnchor={s.anchor}
          className="fill-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase"
        >
          {s.label}
        </text>
      ))}

      {layout.edges.map((edge) => (
        <path
          key={`${edge.from}-${edge.to}`}
          d={edge.d}
          pathLength={1}
          className="dg-edge"
          fill="none"
          stroke="color-mix(in srgb, var(--primary) 70%, var(--muted-foreground))"
          strokeWidth={1.6}
          strokeDasharray="1 1"
          markerEnd={`url(#${idPrefix}-arrow)`}
          style={{ "--d": edge.stage } as React.CSSProperties}
        />
      ))}

      {/* A slow dot travels each edge once the figure has drawn. Hidden under reduced motion (globals.css). */}
      {layout.edges.map((edge, i) => (
        <circle key={`${edge.from}-${edge.to}-dot`} r={3} fill="var(--primary)" className="dg-flow">
          <animateMotion dur={`${3.4 + (i % 4) * 0.45}s`} begin={`${(i * 0.37) % 2.2}s`} repeatCount="indefinite" path={edge.d} />
        </circle>
      ))}

      {layout.nodes.map((node) => (
        <g key={node.id} className="dg-node" style={{ "--d": node.stage, transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}>
          <rect
            x={node.x}
            y={node.y}
            width={node.w}
            height={node.h}
            rx={14}
            fill={node.accent ? "var(--accent)" : "var(--card)"}
            stroke={node.accent ? "var(--primary)" : "var(--rule)"}
            strokeWidth={node.accent ? 1.6 : 1.2}
          />
          <NodeGlyph node={node} />
          <text x={node.x + 52} y={node.y + node.h / 2 + (node.sub ? -3 : 5)} className="fill-foreground text-[13.5px] font-semibold">
            {node.label}
          </text>
          {node.sub ? (
            <text x={node.x + 52} y={node.y + node.h / 2 + 14} className="fill-muted-foreground text-[11.5px]">
              {node.sub}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/**
 * An architecture or flow diagram, drawn as inline SVG from a spec. Two
 * layouts ship in the HTML: stages as columns from 1024px up, and as bands
 * on smaller screens, so labels stay readable at every width. The title and
 * a plain-language description label the figure for screen readers, and the
 * description is also the visible caption. Edges draw and nodes rise in as
 * the figure scrolls into view (globals.css), unless motion is reduced.
 */
export function Diagram({ spec, id, className }: { spec: DiagramSpec; id: string; className?: string }) {
  const wide = layoutWide(spec);
  const narrow = layoutNarrow(spec);
  return (
    <figure className={cn("diagram border-rule bg-card/70 relative overflow-hidden rounded-[var(--radius-xl)] border", className)}>
      <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative flex items-center gap-3 px-5 pt-5 sm:px-7 sm:pt-6">
        <span aria-hidden className="bg-accent text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-[10px]">
          <Workflow className="size-[18px]" strokeWidth={1.75} />
        </span>
        <p className="font-display text-[1.15rem] leading-tight sm:text-[1.3rem]">{spec.title}</p>
      </div>
      <div className="relative px-4 py-6 sm:px-7 sm:py-8">
        <Figure layout={wide} idPrefix={`${id}-wide`} title={spec.title} description={spec.description} className="hidden lg:block" />
        <Figure
          layout={narrow}
          idPrefix={`${id}-narrow`}
          title={spec.title}
          description={spec.description}
          className="mx-auto max-w-[30rem] lg:hidden"
        />
      </div>
      <figcaption className="border-rule text-ink-soft relative border-t px-5 py-4 text-[0.92rem] leading-relaxed sm:px-7">{spec.description}</figcaption>
    </figure>
  );
}
