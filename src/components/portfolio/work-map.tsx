"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { allWork, workKinds, type WorkItem, type WorkKind } from "@/data/work";
import { projectHref, stackCounts } from "@/components/portfolio/terminal-commands";
import { GROUP_BY, KIND_SHAPE, groupWork, layoutGroups, type GroupBy } from "@/components/portfolio/work-map-data";
import { cn } from "@/lib/utils";

const ITEMS = allWork();
const BY_SLUG = new Map(ITEMS.map((w) => [w.slug, w]));
const NONE = "__none__";
/** Technologies named by at least three projects; the rest stay in the table. */
const TECHS = stackCounts(ITEMS).filter((c) => c.count >= 3);
const NO_STACK = ITEMS.filter((w) => w.stack.length === 0).length;

const KIND_COLOR: Record<WorkKind, string> = {
  system: "var(--viz-system)",
  website: "var(--viz-website)",
  ecommerce: "var(--viz-ecommerce)",
  mobile: "var(--viz-mobile)",
};

function kindLabel(kind: WorkKind): string {
  return workKinds.find((k) => k.kind === kind)?.label.replace(/s$/, "") ?? kind;
}

/** One mark. The shape repeats the kind, so colour is never the only signal. */
export function KindMark({ kind, size = 7 }: { kind: WorkKind; size?: number }) {
  const fill = KIND_COLOR[kind];
  switch (KIND_SHAPE[kind]) {
    case "square":
      return <rect x={-size + 0.5} y={-size + 0.5} width={size * 2 - 1} height={size * 2 - 1} rx={2.5} fill={fill} />;
    case "diamond":
      return <polygon points={`0,${-size - 1.5} ${size + 1.5},0 0,${size + 1.5} ${-size - 1.5},0`} fill={fill} />;
    case "triangle":
      return <polygon points={`0,${-size - 1} ${size + 1},${size - 0.5} ${-size - 1},${size - 0.5}`} fill={fill} strokeLinejoin="round" />;
    default:
      return <circle r={size - 0.5} fill={fill} />;
  }
}

function matches(item: WorkItem, tech: string | null): boolean {
  if (tech === null) return true;
  if (tech === NONE) return item.stack.length === 0;
  return item.stack.includes(tech);
}

function describe(item: WorkItem): string {
  const year = item.year === null ? "year not listed" : String(item.year);
  const stack = item.stack.length ? `Stack: ${item.stack.join(", ")}.` : "Stack not listed.";
  const where = item.featured ? "Opens the case study." : "Opens it in the full list.";
  return `${item.name}. ${kindLabel(item.kind)}, ${item.sector}, ${year}. ${stack} ${where}`;
}

/**
 * The work map: every project as one mark, grouped by kind, sector or year,
 * with a technology highlight. Plain SVG and React. Hover or focus shows the
 * project, Enter or a click opens it, and the arrow keys move between marks.
 * The same data is in a table next to it for screen readers and no-JS.
 */
export function WorkMap() {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const markRefs = useRef(new Map<string, { focus: () => void }>());
  const [by, setBy] = useState<GroupBy>("kind");
  const [tech, setTech] = useState<string | null>(null);
  // Server render assumes a desktop width; the viewBox scales it until the real width is measured.
  const [width, setWidth] = useState(1000);
  const [hover, setHover] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const groups = useMemo(() => groupWork(by, ITEMS), [by]);
  const layout = useMemo(() => layoutGroups(groups, width), [groups, width]);
  const positions = useMemo(() => new Map(layout.nodes.map((n) => [n.slug, n])), [layout]);
  const [active, setActive] = useState<string>(layout.nodes[0]?.slug ?? "");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const matched = ITEMS.filter((w) => matches(w, tech)).length;
  const shown = hover ?? focused;
  const shownItem = shown ? BY_SLUG.get(shown) : undefined;
  const shownNode = shown ? positions.get(shown) : undefined;

  function move(from: string, key: string): string | null {
    const node = positions.get(from);
    if (!node) return null;
    const order = layout.nodes;
    const at = order.findIndex((n) => n.slug === from);
    const groupKeys = groups.map((g) => g.key);
    const g = groupKeys.indexOf(node.group);
    const inGroup = (key: string) => order.filter((n) => n.group === key);
    switch (key) {
      case "ArrowRight":
        return order[Math.min(order.length - 1, at + 1)].slug;
      case "ArrowLeft":
        return order[Math.max(0, at - 1)].slug;
      case "ArrowDown":
      case "ArrowUp": {
        const target = groupKeys[g + (key === "ArrowDown" ? 1 : -1)];
        if (!target) return null;
        const list = inGroup(target);
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

  // Keep the tooltip inside the chart.
  const tipLeft = shownNode ? Math.min(Math.max(shownNode.x, 130), Math.max(130, layout.width - 130)) : 0;
  const tipBelow = shownNode ? shownNode.y < 150 : false;

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="kicker" id="map-group-label">
            Group by
          </p>
          <div role="group" aria-labelledby="map-group-label" className="border-rule bg-card mt-2.5 inline-flex rounded-full border p-1">
            {GROUP_BY.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={by === option.value}
                onClick={() => setBy(option.value)}
                className={cn(
                  "min-h-10 rounded-full px-4 font-mono text-[0.8rem] transition-colors",
                  by === option.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0 lg:max-w-[62%]">
          <p className="kicker lg:text-right" id="map-tech-label">
            Highlight a technology
          </p>
          <div
            role="group"
            aria-labelledby="map-tech-label"
            className="-mx-4 mt-2.5 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 lg:justify-end"
          >
            {[{ tech: null as string | null, label: "None", count: ITEMS.length }, ...TECHS.map((c) => ({ tech: c.tech as string | null, label: c.tech, count: c.count })), { tech: NONE as string | null, label: "No stack listed", count: NO_STACK }].map((chip) => (
              <button
                key={chip.label}
                type="button"
                aria-pressed={tech === chip.tech}
                onClick={() => setTech(chip.tech)}
                className={cn(
                  "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.82rem] whitespace-nowrap transition-colors",
                  tech === chip.tech
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-rule text-ink-soft hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {chip.label}
                {chip.tech !== null ? <span className="font-mono text-[0.72rem] opacity-70">{chip.count}</span> : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ul className="text-muted-foreground mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem]" aria-label="Legend">
        {workKinds.map(({ kind, label }) => (
          <li key={kind} className="inline-flex items-center gap-2">
            <svg aria-hidden width="18" height="18" viewBox="-9 -9 18 18">
              <KindMark kind={kind} size={6} />
            </svg>
            {label}
            <span className="font-mono text-[0.75rem]">{ITEMS.filter((w) => w.kind === kind).length}</span>
          </li>
        ))}
        <li className="inline-flex items-center gap-2">
          <svg aria-hidden width="20" height="20" viewBox="-10 -10 20 20">
            <circle r={4} fill="var(--muted-foreground)" />
            <circle r={8.5} fill="none" stroke="var(--foreground)" strokeWidth={1.5} />
          </svg>
          Has a case study
        </li>
      </ul>

      <p className="text-ink-soft mt-4 font-mono text-[0.78rem]" aria-live="polite">
        {tech === null
          ? `${ITEMS.length} projects, grouped by ${by}.`
          : tech === NONE
            ? `${matched} of ${ITEMS.length} projects have no stack in the listing.`
            : `${matched} of ${ITEMS.length} projects list ${tech}.`}
      </p>

      <div ref={wrapRef} className="relative mt-5">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width="100%"
          role="group"
          aria-label={`Work map: ${ITEMS.length} projects grouped by ${by}. Arrow keys move between projects, Enter opens one.`}
          className="block h-auto overflow-visible"
        >
          {layout.rows.map((row, i) =>
            i === 0 ? null : (
              <line key={row.key} x1={0} x2={layout.width} y1={row.y - 9} y2={row.y - 9} stroke="var(--rule)" strokeWidth={1} />
            ),
          )}
          {layout.labels.map((label) => (
            <text key={label.key} x={label.x} y={label.y + (layout.stacked ? 14 : layout.step / 2 + 5)} className="fill-foreground text-[13px]">
              <tspan fontWeight={500}>{label.label}</tspan>
              <tspan dx={8} className="fill-muted-foreground font-mono text-[11.5px]">
                {label.count}
              </tspan>
              {label.note ? (
                <tspan
                  x={layout.stacked ? undefined : label.x}
                  dx={layout.stacked ? 10 : undefined}
                  dy={layout.stacked ? 0 : 19}
                  className="fill-muted-foreground text-[11.5px]"
                >
                  {label.note}
                </tspan>
              ) : null}
            </text>
          ))}

          {ITEMS.map((item, i) => {
            const node = positions.get(item.slug);
            if (!node) return null;
            const on = matches(item, tech);
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
                className="cursor-pointer outline-none"
                style={{
                  transform: `translate(${node.x}px, ${node.y}px)`,
                  opacity: on ? 1 : 0.16,
                  transition: "transform 700ms cubic-bezier(0.2, 0.75, 0.15, 1), opacity 250ms ease",
                  transitionDelay: `${Math.min(i * 7, 320)}ms, 0ms`,
                }}
              >
                {/* Hit area larger than the mark, 24px or more. */}
                <circle r={layout.step / 2} fill="transparent" />
                {isShown ? <circle r={layout.step / 2 - 1} fill="none" stroke="var(--ring)" strokeWidth={2} /> : null}
                <g style={{ transform: isShown ? "scale(1.25)" : undefined, transition: "transform 150ms ease" }}>
                  <KindMark kind={item.kind} size={(item.featured ? 0.16 : 0.25) * layout.step} />
                  {item.featured ? <circle r={0.31 * layout.step} fill="none" stroke="var(--foreground)" strokeWidth={1.5} /> : null}
                </g>
              </a>
            );
          })}
        </svg>

        {shownItem && shownNode ? (
          <div
            aria-hidden
            className="border-rule bg-popover text-popover-foreground pointer-events-none absolute z-10 w-[min(260px,calc(100vw-48px))] rounded-[12px] border p-3.5 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.35)]"
            style={{
              left: `${(tipLeft / layout.width) * 100}%`,
              top: `${((shownNode.y + (tipBelow ? 22 : -22)) / layout.height) * 100}%`,
              transform: `translate(-50%, ${tipBelow ? "0" : "-100%"})`,
            }}
          >
            <p className="font-mono text-[0.68rem] tracking-[0.1em] text-muted-foreground uppercase">
              {kindLabel(shownItem.kind)} · {shownItem.sector} · {shownItem.year ?? "year not listed"}
            </p>
            <p className="mt-1.5 text-[0.95rem] leading-snug font-semibold tracking-[-0.01em]">{shownItem.name}</p>
            <p className="text-muted-foreground mt-1.5 font-mono text-[0.72rem] leading-relaxed">
              {shownItem.stack.length ? shownItem.stack.join(" · ") : "Stack not listed"}
            </p>
            <p className="text-primary mt-2 text-[0.8rem] font-medium">{shownItem.featured ? "Open the case study →" : "See it in the list →"}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
