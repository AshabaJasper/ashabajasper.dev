"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Building2, CalendarDays, Globe, Layers, Rocket, Shapes, Star, type LucideIcon } from "lucide-react";
import { allWork, workKinds, type WorkItem, type WorkKind } from "@/data/work";
import { KIND_ICON, sectorIcon } from "@/components/portfolio/icons";
import { LogoSvg } from "@/components/portfolio/logo";
import { techFallbackIcon } from "@/components/portfolio/tech-map";
import { projectHref } from "@/components/portfolio/terminal-commands";
import { GROUP_BY, MAP_TECHS, STACK_FAMILIES, groupWork, layoutGroups, type GroupBy, type MapGroup } from "@/components/portfolio/work-map-data";
import { cn } from "@/lib/utils";

const ITEMS = allWork();
const BY_SLUG = new Map(ITEMS.map((w) => [w.slug, w]));

const KIND_COLOR: Record<WorkKind, string> = {
  system: "var(--viz-system)",
  website: "var(--viz-website)",
  ecommerce: "var(--viz-ecommerce)",
  mobile: "var(--viz-mobile)",
};

const GROUP_ICON: Record<GroupBy, LucideIcon> = {
  kind: Shapes,
  sector: Building2,
  year: CalendarDays,
  stack: Layers,
};

type Logos = Record<string, { path: string; hex: string | null }>;

function kindLabel(kind: WorkKind): string {
  return workKinds.find((k) => k.kind === kind)?.label.replace(/s$/, "") ?? kind;
}

function describe(item: WorkItem): string {
  const when = item.year === null ? "" : `, ${item.year}`;
  const stack = item.stack.length ? ` Built with ${item.stack.join(", ")}.` : "";
  const where = item.featured ? "Opens the case study." : "Opens it in the full list.";
  return `${item.name}. ${kindLabel(item.kind)}, ${item.sector}${when}.${stack} ${where}`;
}

/** A small rounded tile holding a kind icon, tinted with the kind colour. */
export function KindTile({ kind, className, solid = false }: { kind: WorkKind; className?: string; solid?: boolean }) {
  const Icon = KIND_ICON[kind];
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center rounded-[9px] border", className)}
      style={{
        color: solid ? "var(--background)" : KIND_COLOR[kind],
        background: solid ? KIND_COLOR[kind] : `color-mix(in srgb, ${KIND_COLOR[kind]} 14%, var(--card))`,
        borderColor: `color-mix(in srgb, ${KIND_COLOR[kind]} 45%, transparent)`,
      }}
    >
      <Icon className="size-[55%]" strokeWidth={2} />
    </span>
  );
}

function GroupGlyph({ by, group, logos }: { by: GroupBy; group: MapGroup; logos: Logos }) {
  const box = "border-rule bg-card text-foreground inline-flex size-10 shrink-0 items-center justify-center rounded-[11px] border shadow-[0_1px_0_var(--rule)]";
  if (by === "kind") return <KindTile kind={group.key as WorkKind} className="size-10 rounded-[11px]" />;
  if (by === "stack") {
    const family = STACK_FAMILIES.find((f) => f.key === group.key);
    if (!family) {
      return (
        <span aria-hidden className={box}>
          <Globe className="size-[18px]" strokeWidth={1.75} />
        </span>
      );
    }
    return (
      <span aria-hidden className="border-rule bg-card inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[11px] border px-2.5">
        {family.logos.slice(0, 3).map((slug) =>
          logos[slug] ? <LogoSvg key={slug} path={logos[slug].path} hex={logos[slug].hex} brand className="size-[18px]" /> : null,
        )}
      </span>
    );
  }
  const Icon = by === "year" ? (group.key === "more" ? Rocket : CalendarDays) : group.key === "other" ? Layers : sectorIcon(group.label);
  return (
    <span aria-hidden className={box}>
      <Icon className="text-primary size-[18px]" strokeWidth={1.75} />
    </span>
  );
}

/**
 * The work map: every project as one tile, grouped by kind, sector, year or
 * stack, with a technology highlight. Tiles fly to their new places when the
 * grouping changes. Hover or focus shows the project, Enter or a click opens
 * it, and the arrow keys move between tiles. The same data is in a table
 * next to it for screen readers and readers without JavaScript.
 */
export function WorkMap({ logos }: { logos: Logos }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const markRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [by, setBy] = useState<GroupBy>("kind");
  const [tech, setTech] = useState<string | null>(null);
  // Server render assumes a desktop width; the wrapper clips until the real width is measured.
  const [width, setWidth] = useState(1000);
  const [measured, setMeasured] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const groups = useMemo(() => groupWork(by, ITEMS), [by]);
  const layout = useMemo(() => layoutGroups(groups, width), [groups, width]);
  const positions = useMemo(() => new Map(layout.nodes.map((n) => [n.slug, n])), [layout]);
  const [active, setActive] = useState<string>(layout.nodes[0]?.slug ?? "");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => {
      const next = Math.round(el.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    read();
    // Let the first measured layout land before transitions switch on.
    const frame = requestAnimationFrame(() => setMeasured(true));
    if (typeof ResizeObserver === "undefined") return () => cancelAnimationFrame(frame);
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const matches = (item: WorkItem) => tech === null || item.stack.includes(tech);
  const matched = ITEMS.filter(matches).length;
  const shown = hover ?? focused;
  const shownItem = shown ? BY_SLUG.get(shown) : undefined;
  const shownNode = shown ? positions.get(shown) : undefined;
  const byIndex = GROUP_BY.findIndex((g) => g.value === by);
  const tile = layout.step - 8;

  function move(from: string, key: string): string | null {
    const node = positions.get(from);
    if (!node) return null;
    const order = layout.nodes;
    const at = order.findIndex((n) => n.slug === from);
    const groupKeys = groups.map((g) => g.key);
    const g = groupKeys.indexOf(node.group);
    switch (key) {
      case "ArrowRight":
        return order[Math.min(order.length - 1, at + 1)].slug;
      case "ArrowLeft":
        return order[Math.max(0, at - 1)].slug;
      case "ArrowDown":
      case "ArrowUp": {
        const target = groupKeys[g + (key === "ArrowDown" ? 1 : -1)];
        if (!target) return null;
        const list = order.filter((n) => n.group === target);
        return list[Math.min(node.index, list.length - 1)]?.slug ?? null;
      }
      case "Home":
        return order[0].slug;
      case "End":
        return order[order.length - 1].slug;
      default:
        return null;
    }
  }

  function onKeyDown(event: React.KeyboardEvent, slug: string) {
    const next = move(slug, event.key);
    if (next === null) return;
    event.preventDefault();
    setActive(next);
    markRefs.current.get(next)?.focus();
  }

  function open(event: React.MouseEvent, item: WorkItem) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    router.push(projectHref(item));
  }

  // Keep the card inside the map.
  const tipLeft = shownNode ? Math.min(Math.max(shownNode.x, 140), Math.max(140, layout.width - 140)) : 0;
  const tipBelow = shownNode ? shownNode.y < 190 : false;
  const total = ITEMS.length;

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="kicker" id="map-group-label">
            Group by
          </p>
          <div
            role="group"
            aria-labelledby="map-group-label"
            className="segmented border-rule bg-card/80 relative mt-2.5 grid w-full max-w-[26rem] grid-cols-4 rounded-full border p-1 shadow-[inset_0_1px_0_var(--rule)] backdrop-blur"
          >
            <span
              aria-hidden
              className="bg-foreground absolute top-1 bottom-1 left-1 rounded-full shadow-[0_6px_18px_-8px_rgb(0_0_0/0.45)] transition-transform duration-500 ease-[cubic-bezier(0.2,0.75,0.15,1)]"
              style={{ width: "calc((100% - 0.5rem) / 4)", transform: `translateX(${byIndex * 100}%)` }}
            />
            {GROUP_BY.map((option) => {
              const Icon = GROUP_ICON[option.value];
              const on = by === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setBy(option.value)}
                  className={cn(
                    "relative z-10 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-2 text-[0.84rem] font-medium transition-colors duration-300",
                    on ? "text-background" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="min-w-0 lg:max-w-[60%]">
          <p className="kicker lg:text-right" id="map-tech-label">
            Highlight a technology
          </p>
          <div
            role="group"
            aria-labelledby="map-tech-label"
            className="-mx-4 mt-2.5 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:justify-end"
          >
            {[{ tech: null as string | null, label: "All", count: total }, ...MAP_TECHS.map((c) => ({ tech: c.tech as string | null, label: c.tech, count: c.count }))].map(
              (chip) => {
                const on = tech === chip.tech;
                const logo = chip.tech ? logos[chip.tech] : undefined;
                const Fallback = chip.tech ? techFallbackIcon(chip.tech) : Shapes;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTech(chip.tech)}
                    className={cn(
                      "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-[0.82rem] whitespace-nowrap transition-[color,background-color,border-color,transform] duration-200 active:scale-95",
                      on ? "border-primary bg-accent text-accent-foreground" : "border-rule bg-card/60 text-ink-soft hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    {logo ? (
                      <LogoSvg path={logo.path} hex={logo.hex} brand className="size-3.5" />
                    ) : (
                      <Fallback aria-hidden className="size-3.5 shrink-0" strokeWidth={2} />
                    )}
                    {chip.label}
                    <span className="font-mono text-[0.72rem] opacity-70">{chip.count}</span>
                  </button>
                );
              },
            )}
          </div>
        </div>
      </div>

      <ul className="mt-7 flex flex-wrap gap-2" aria-label="Key">
        {workKinds.map(({ kind, label }) => (
          <li key={kind} className="border-rule bg-card/60 inline-flex items-center gap-2.5 rounded-full border py-1 pr-3.5 pl-1 text-[0.84rem]">
            <KindTile kind={kind} className="size-7 rounded-full" />
            <span className="text-foreground">{label}</span>
            <span className="text-muted-foreground font-mono text-[0.75rem]">{ITEMS.filter((w) => w.kind === kind).length}</span>
          </li>
        ))}
        <li className="border-rule bg-card/60 inline-flex items-center gap-2.5 rounded-full border py-1 pr-3.5 pl-1 text-[0.84rem]">
          <span aria-hidden className="bg-foreground text-background inline-flex size-7 items-center justify-center rounded-full">
            <Star className="size-3.5 fill-current" strokeWidth={2} />
          </span>
          <span className="text-foreground">Case study</span>
          <span className="text-muted-foreground font-mono text-[0.75rem]">{ITEMS.filter((w) => w.featured).length}</span>
        </li>
      </ul>

      <p className="text-ink-soft mt-5 font-mono text-[0.78rem]" aria-live="polite">
        {tech === null ? `${total} projects, grouped by ${by}.` : `${matched} projects built with ${tech}.`}
      </p>

      <div
        ref={wrapRef}
        role="group"
        aria-label={`Work map: ${total} projects grouped by ${by}. Arrow keys move between projects, Enter opens one.`}
        className={cn("work-map relative mt-6 overflow-x-clip", measured && "is-measured")}
        style={{ height: layout.height }}
      >
        {layout.rows.map((row, i) =>
          i === 0 ? null : <span key={`${by}-${row.key}-rule`} aria-hidden className="bg-rule absolute inset-x-0 h-px" style={{ top: row.y - 11 }} />,
        )}
        {layout.labels.map((label, i) => {
          const group = groups[i];
          return (
            <div
              key={`${by}-${label.key}`}
              aria-hidden
              className="map-label absolute left-0 flex items-center gap-3"
              style={{ top: label.y + (layout.stacked ? 0 : 3), width: layout.stacked ? "100%" : 262, "--i": i } as React.CSSProperties}
            >
              <GroupGlyph by={by} group={group} logos={logos} />
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  <span className="text-foreground truncate text-[0.95rem] leading-tight font-semibold tracking-[-0.01em]">{label.label}</span>
                  <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 font-mono text-[0.68rem] leading-none tabular-nums">
                    {label.count}
                  </span>
                </span>
                <span className="mt-1.5 flex items-center gap-2">
                  <span className="bg-rule relative block h-1 w-20 overflow-hidden rounded-full">
                    <span
                      className="bg-primary absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
                      style={{ width: `${Math.max(6, (label.count / total) * 100)}%` }}
                    />
                  </span>
                  {label.note ? <span className="text-muted-foreground truncate text-[0.72rem]">{label.note}</span> : null}
                </span>
              </span>
            </div>
          );
        })}

        {ITEMS.map((item, i) => {
          const node = positions.get(item.slug);
          if (!node) return null;
          const on = matches(item);
          const isShown = shown === item.slug;
          return (
            <a
              key={item.slug}
              href={projectHref(item)}
              ref={(el) => {
                if (el) markRefs.current.set(item.slug, el);
                else markRefs.current.delete(item.slug);
              }}
              tabIndex={active === item.slug ? 0 : -1}
              aria-label={describe(item)}
              onClick={(event) => open(event, item)}
              onKeyDown={(event) => onKeyDown(event, item.slug)}
              onFocus={() => {
                setFocused(item.slug);
                setActive(item.slug);
              }}
              onBlur={() => setFocused((f) => (f === item.slug ? null : f))}
              onMouseEnter={() => setHover(item.slug)}
              onMouseLeave={() => setHover((h) => (h === item.slug ? null : h))}
              className="map-mark absolute top-0 left-0 rounded-[10px] focus-visible:outline-offset-2"
              style={{
                width: tile,
                height: tile,
                transform: `translate(${node.x - tile / 2}px, ${node.y - tile / 2}px)`,
                transitionDelay: measured ? `${Math.min(i * 9, 360)}ms` : "0ms",
                zIndex: isShown ? 5 : undefined,
              }}
            >
              <span
                className="map-mark-inner relative flex size-full items-center justify-center"
                style={{
                  opacity: on ? 1 : 0.16,
                  transform: isShown ? "scale(1.18)" : on ? undefined : "scale(0.82)",
                }}
              >
                <KindTile kind={item.kind} solid={item.featured} className="size-full rounded-[10px]" />
                {item.featured ? (
                  <span
                    aria-hidden
                    className="bg-foreground text-background ring-background absolute -top-1.5 -right-1.5 inline-flex size-4 items-center justify-center rounded-full ring-2"
                  >
                    <Star className="size-2.5 fill-current" strokeWidth={2} />
                  </span>
                ) : null}
              </span>
            </a>
          );
        })}

        {shownItem && shownNode ? (
          <div
            aria-hidden
            className="map-tip border-rule bg-popover text-popover-foreground pointer-events-none absolute z-20 w-[min(280px,calc(100vw-48px))] rounded-[14px] border p-4 shadow-[0_18px_50px_-18px_rgb(0_0_0/0.45)]"
            style={{
              left: Math.max(0, Math.min(tipLeft - 140, layout.width - 280)),
              top: shownNode.y + (tipBelow ? tile / 2 + 10 : -(tile / 2 + 10)),
              transform: tipBelow ? undefined : "translateY(-100%)",
            }}
          >
            <p className="flex items-center gap-2">
              <KindTile kind={shownItem.kind} className="size-6 rounded-[7px]" />
              <span className="text-muted-foreground font-mono text-[0.68rem] tracking-[0.08em] uppercase">
                {kindLabel(shownItem.kind)} · {shownItem.sector}
                {shownItem.year !== null ? ` · ${shownItem.year}` : ""}
              </span>
            </p>
            <p className="mt-2 text-[0.98rem] leading-snug font-semibold tracking-[-0.01em]">{shownItem.name}</p>
            {shownItem.stack.length ? (
              <p className="mt-2.5 flex flex-wrap gap-1">
                {shownItem.stack.slice(0, 6).map((t) => {
                  const logo = logos[t];
                  const Fallback = techFallbackIcon(t);
                  return (
                    <span key={t} className="border-rule text-ink-soft inline-flex items-center gap-1 rounded-full border px-2 py-1 font-mono text-[0.66rem] leading-none">
                      {logo ? <LogoSvg path={logo.path} hex={logo.hex} brand className="size-3" /> : <Fallback aria-hidden className="size-3" strokeWidth={2} />}
                      {t}
                    </span>
                  );
                })}
              </p>
            ) : (
              <p className="text-ink-soft mt-1.5 line-clamp-3 text-[0.82rem] leading-snug">{shownItem.summary}</p>
            )}
            <p className="text-primary mt-3 inline-flex items-center gap-1 text-[0.8rem] font-medium">
              {shownItem.featured ? "Open the case study" : "See it in the list"}
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
