import { Children, cloneElement, isValidElement, useId, type CSSProperties, type ReactElement, type ReactNode } from "react";
import { ArrowRight, CircleCheck, Info, Lightbulb, TriangleAlert, type LucideIcon } from "lucide-react";
import { figureIcon } from "@/components/blog/figure-icons";
import { cn } from "@/lib/utils";

/**
 * Figures a post can use in MDX. Posts cannot pass JS expressions (blockJS),
 * so every component takes string props and child elements only. All of
 * them render on the server; the draw-in motion is CSS (scroll-driven where
 * supported, static otherwise and under reduced motion, see blog.css).
 */

function stagger(i: number): CSSProperties {
  return { ["--i" as string]: i };
}

function elements(children: ReactNode): ReactElement<Record<string, unknown>>[] {
  return Children.toArray(children).filter(isValidElement) as ReactElement<Record<string, unknown>>[];
}

/* Callout ----------------------------------------------------------------- */

const CALLOUT_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  note: { icon: Info, label: "Note" },
  tip: { icon: Lightbulb, label: "Tip" },
  warning: { icon: TriangleAlert, label: "Watch out" },
  check: { icon: CircleCheck, label: "Check" },
};

export function Callout({ type = "note", title, children }: { type?: string; title?: string; children?: ReactNode }) {
  const kind = CALLOUT_ICONS[type] ? type : "note";
  const { icon: Icon, label } = CALLOUT_ICONS[kind];
  return (
    <aside role="note" aria-label={title ?? label} className={cn("callout", `callout-${kind}`)}>
      <span className="callout-icon" aria-hidden>
        <Icon className="size-[1.1rem]" strokeWidth={1.9} />
      </span>
      <div className="callout-content">
        <p className="callout-title">{title ?? label}</p>
        <div className="callout-body">{children}</div>
      </div>
    </aside>
  );
}

/** The original <Note> callout, kept so every post can still use it. */
export function Note({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <Callout type="note" title={title}>
      {children}
    </Callout>
  );
}

/* Diagram: a flow of nodes joined by arrows -------------------------------- */

export function Node({
  title,
  detail,
  label,
  icon,
  tone = "default",
  index = 0,
  total = 1,
}: {
  title: string;
  detail?: string;
  label?: string;
  icon?: string;
  tone?: string;
  index?: number;
  total?: number;
}) {
  const Icon = figureIcon(icon);
  return (
    <li className={cn("flow-node", `flow-node-${tone}`)} style={stagger(index * 2)}>
      <span className="sr-only">
        Step {index + 1} of {total}:{" "}
      </span>
      <span className="flow-node-head" aria-hidden>
        {Icon ? (
          <span className="flow-node-icon">
            <Icon className="size-4" strokeWidth={1.9} />
          </span>
        ) : null}
        <span className="flow-node-index">{String(index + 1).padStart(2, "0")}</span>
      </span>
      {label ? <span className="flow-node-label">{label}</span> : null}
      <span className="flow-node-title">{title}</span>
      {detail ? <span className="flow-node-detail">{detail}</span> : null}
    </li>
  );
}

function FlowArrow({ i }: { i: number }) {
  return (
    <li className="flow-arrow" aria-hidden style={stagger(i)}>
      <svg viewBox="0 0 40 24" className="flow-arrow-h" focusable="false">
        <path className="dg-draw dg-line" pathLength={1} d="M2 12 H34" />
        <path className="dg-draw dg-line" pathLength={1} d="M28 6 L35 12 L28 18" />
      </svg>
      <svg viewBox="0 0 24 32" className="flow-arrow-v" focusable="false">
        <path className="dg-draw dg-line" pathLength={1} d="M12 2 V26" />
        <path className="dg-draw dg-line" pathLength={1} d="M6 20 L12 27 L18 20" />
      </svg>
    </li>
  );
}

/**
 * <Diagram caption="..." summary="..."> with <Node title="..." /> children.
 * The nodes are real text in an ordered list, so the diagram reads as a
 * numbered sequence without the picture; `summary` adds a sentence for
 * screen readers that says what the figure shows.
 */
export function Diagram({ caption, summary, children }: { caption?: string; summary?: string; children?: ReactNode }) {
  const id = useId();
  const nodes = elements(children);
  const total = nodes.length;
  const items: ReactNode[] = [];
  nodes.forEach((node, index) => {
    if (index > 0) items.push(<FlowArrow key={`a${index}`} i={index * 2 - 1} />);
    items.push(cloneElement(node, { key: `n${index}`, index, total }));
  });
  return (
    <figure
      className="figure wide dg not-prose"
      aria-labelledby={caption ? `${id}-cap` : undefined}
      aria-describedby={summary ? `${id}-sum` : undefined}
    >
      <div className="flow" data-count={total}>
        <ol className="flow-list">{items}</ol>
      </div>
      {summary ? (
        <p id={`${id}-sum`} className="sr-only">
          {summary}
        </p>
      ) : null}
      {caption ? (
        <figcaption id={`${id}-cap`} className="figure-caption">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/* Steps: a numbered vertical timeline -------------------------------------- */

export function Step({
  title,
  icon,
  index = 0,
  children,
}: {
  title: string;
  icon?: string;
  index?: number;
  children?: ReactNode;
}) {
  const Icon = figureIcon(icon);
  return (
    <li className="step" style={stagger(index)}>
      <span className="step-marker" aria-hidden>
        {Icon ? <Icon className="size-4" strokeWidth={1.9} /> : <span>{index + 1}</span>}
      </span>
      <div className="step-content">
        <p className="step-title">
          <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
          {title}
        </p>
        <div className="step-body">{children}</div>
      </div>
    </li>
  );
}

export function Steps({ caption, children }: { caption?: string; children?: ReactNode }) {
  const steps = elements(children);
  return (
    <figure className="figure dg steps-figure">
      <ol className="steps">{steps.map((step, index) => cloneElement(step, { key: index, index }))}</ol>
      {caption ? <figcaption className="figure-caption">{caption}</figcaption> : null}
    </figure>
  );
}

/** Timeline is Steps under another name, for posts where the order is time. */
export const Timeline = Steps;

/* Stats ------------------------------------------------------------------- */

export function Stat({ value, unit, label, index = 0 }: { value: string; unit?: string; label: string; index?: number }) {
  return (
    <div className="stat" style={stagger(index)}>
      <dt className="stat-label">{label}</dt>
      <dd className="stat-value">
        {value}
        {unit ? <span className="stat-unit">{unit}</span> : null}
      </dd>
    </div>
  );
}

export function Stats({ caption, children }: { caption?: string; children?: ReactNode }) {
  const stats = elements(children);
  return (
    <figure className="figure wide dg not-prose">
      <dl className="stats" data-count={stats.length}>
        {stats.map((stat, index) => cloneElement(stat, { key: index, index }))}
      </dl>
      {caption ? <figcaption className="figure-caption">{caption}</figcaption> : null}
    </figure>
  );
}

/* Compare: two columns ----------------------------------------------------- */

export function CompareSide({
  title,
  tone = "neutral",
  icon,
  label,
  children,
}: {
  title: string;
  tone?: string;
  icon?: string;
  label?: string;
  children?: ReactNode;
}) {
  const fallback = tone === "before" ? "cross" : tone === "after" ? "check" : undefined;
  const Icon = figureIcon(icon ?? fallback);
  return (
    <div className={cn("compare-side", `compare-${tone}`)}>
      <div className="compare-head">
        {Icon ? (
          <span className="compare-icon" aria-hidden>
            <Icon className="size-4" strokeWidth={1.9} />
          </span>
        ) : null}
        <div>
          {label ? <p className="compare-label">{label}</p> : null}
          <p className="compare-title">{title}</p>
        </div>
      </div>
      <div className="compare-body">{children}</div>
    </div>
  );
}

export function Compare({ caption, children }: { caption?: string; children?: ReactNode }) {
  return (
    <figure className="figure wide dg">
      <div className="compare">{children}</div>
      {caption ? <figcaption className="figure-caption">{caption}</figcaption> : null}
    </figure>
  );
}

/* Cards: an icon grid, optionally linking to sections ---------------------- */

export function Card({
  title,
  icon,
  href,
  index = 0,
  children,
}: {
  title: string;
  icon?: string;
  href?: string;
  index?: number;
  children?: ReactNode;
}) {
  const Icon = figureIcon(icon);
  const inner = (
    <>
      <span className="card-top" aria-hidden>
        {Icon ? (
          <span className="card-icon">
            <Icon className="size-[1.1rem]" strokeWidth={1.9} />
          </span>
        ) : null}
        <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
      </span>
      <span className="card-title">{title}</span>
      <div className="card-body">{children}</div>
      {href ? (
        <span className="card-more" aria-hidden>
          Read the section <ArrowRight className="size-3.5" strokeWidth={1.9} />
        </span>
      ) : null}
    </>
  );
  return (
    <li className="card-item" style={stagger(index)}>
      {href ? (
        <a href={href} className="card card-link">
          {inner}
        </a>
      ) : (
        <div className="card">{inner}</div>
      )}
    </li>
  );
}

export function Cards({ caption, children }: { caption?: string; children?: ReactNode }) {
  const cards = elements(children);
  return (
    <figure className="figure wide dg not-prose">
      <ul className="cards">{cards.map((card, index) => cloneElement(card, { key: index, index }))}</ul>
      {caption ? <figcaption className="figure-caption">{caption}</figcaption> : null}
    </figure>
  );
}
