import { useId, type CSSProperties, type ReactNode } from "react";
import { HANDWRITING_CNN, layerShapes, totalParams, type LayerShape } from "@/components/blog/cnn-shapes";

/**
 * Hand-drawn SVG figures for specific posts. Each one renders a wide and a
 * narrow layout (CSS shows one), both aria-hidden, plus a text alternative
 * in the HTML that says everything the picture says. Colours come from
 * classes in blog.css so light and dark themes both work.
 */

function stagger(i: number): CSSProperties {
  return { ["--i" as string]: i };
}

function Frame({
  caption,
  description,
  children,
  className,
}: {
  caption: string;
  description: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <figure className={`figure wide dg not-prose svg-figure ${className ?? ""}`} aria-labelledby={`${id}-cap`} aria-describedby={`${id}-desc`}>
      <div className="svg-figure-canvas">{children}</div>
      <div id={`${id}-desc`} className="sr-only">
        {description}
      </div>
      <figcaption id={`${id}-cap`} className="figure-caption">
        {caption}
      </figcaption>
    </figure>
  );
}

/* Booking timeline ----------------------------------------------------------- */

const DAYS = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu"];

type Stay = {
  who: string;
  status: string;
  from: number;
  to: number;
  result: "held" | "refused" | "accepted";
  note: string;
};

const STAYS: Stay[] = [
  { who: "Guest A", status: "confirmed", from: 0, to: 3, result: "held", note: "Holds Saturday, Sunday and Monday nights" },
  { who: "Guest B", status: "new request", from: 2, to: 4, result: "refused", note: "Refused: shares Monday night (23P01)" },
  { who: "Guest C", status: "new request", from: 3, to: 5, result: "accepted", note: "Accepted: starts the day A leaves" },
];

function TimelineSvg({ narrow }: { narrow: boolean }) {
  const width = narrow ? 360 : 760;
  const left = narrow ? 12 : 168;
  const right = 12;
  const dayW = (width - left - right) / DAYS.length;
  const top = 44;
  const rowH = narrow ? 104 : 86;
  const barH = 30;
  const height = top + STAYS.length * rowH + 34;
  const x = (day: number) => left + day * dayW;
  const hatchId = `tl-hatch-${narrow ? "n" : "w"}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={narrow ? "svg-narrow" : "svg-wide"}
      aria-hidden
      focusable="false"
    >
      <defs>
        <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" className="tl-hatch-bg" />
          <line x1="0" y1="0" x2="0" y2="6" className="tl-hatch-line" />
        </pattern>
      </defs>

      {/* Day columns: each column is one night, labelled by its date. */}
      {DAYS.map((day, i) => (
        <g key={day}>
          <rect x={x(i)} y={top - 14} width={dayW} height={height - top - 6} className={i % 2 ? "tl-col-alt" : "tl-col"} />
          <text x={x(i) + dayW / 2} y={22} textAnchor="middle" className="dg-mono dg-muted">
            {day}
          </text>
        </g>
      ))}

      {/* Same-day turnover line on Tuesday. */}
      <line x1={x(3)} y1={top - 14} x2={x(3)} y2={height - 26} className="tl-turnover dg-fade" style={stagger(1)} />
      <text x={x(3)} y={height - 10} textAnchor="middle" className="dg-mono dg-accent-text">
        Tue: one leaves, one arrives
      </text>

      {STAYS.map((stay, row) => {
        const rowTop = top + row * rowH;
        const barY = narrow ? rowTop + 24 : rowTop + 6;
        const x1 = x(stay.from);
        const x2 = x(stay.to);
        const labelY = narrow ? rowTop + 14 : rowTop + 20;
        const noteY = barY + barH + 18;
        return (
          <g key={stay.who}>
            {narrow ? (
              <text x={left} y={labelY} className="dg-text dg-strong">
                {stay.who}
                <tspan className="dg-muted" dx="6">
                  {stay.status}
                </tspan>
              </text>
            ) : (
              <>
                <text x={0} y={labelY} className="dg-text dg-strong">
                  {stay.who}
                </text>
                <text x={0} y={labelY + 18} className="dg-mono dg-muted">
                  {stay.status}
                </text>
              </>
            )}
            <g className="dg-grow" style={stagger(row * 2 + 1)}>
              <rect x={x1 + 2} y={barY} width={x2 - x1 - 4} height={barH} rx={7} className={`tl-bar tl-bar-${stay.result}`} />
              {stay.result === "refused" ? (
                <rect x={x(2) + 2} y={barY} width={dayW - 2} height={barH} rx={0} fill={`url(#${hatchId})`} className="tl-overlap" />
              ) : null}
              {/* Half-open range: a closed edge at check-in, an open notch at check-out. */}
              <rect x={x1 + 2} y={barY} width={4} height={barH} rx={2} className={`tl-edge tl-edge-${stay.result}`} />
              <circle cx={x2 - 2} cy={barY + barH / 2} r={4.5} className={`tl-open tl-open-${stay.result}`} />
              <text
                x={(stay.result === "refused" && !narrow ? x(3) : x1) + 12}
                y={barY + barH / 2 + 4.5}
                className={`dg-mono dg-text ${stay.result === "refused" && narrow ? "tl-note" : ""}`}
              >
                [{DAYS[stay.from]}, {DAYS[stay.to]})
              </text>
            </g>
            <g className="dg-fade" style={stagger(row * 2 + 2)}>
              <text x={narrow ? left : x1 + 2} y={noteY} className={`dg-mono tl-note tl-note-${stay.result}`}>
                {stay.result === "refused" ? "✕ " : stay.result === "accepted" ? "✓ " : ""}
                {stay.note}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

export function BookingTimeline() {
  return (
    <Frame
      caption="One room, three stays. Each range includes the check-in night and excludes the check-out day, so Guest C can arrive on the Tuesday Guest A leaves, while Guest B's stay shares Monday night and is refused."
      description={
        <>
          <p>A timeline of one room from Saturday to Thursday.</p>
          <ol>
            <li>Guest A, confirmed, holds the room from Saturday to Tuesday, written [Sat, Tue).</li>
            <li>
              Guest B asks for Monday to Wednesday. That range shares Monday night with Guest A, so Postgres refuses the
              insert with error 23P01.
            </li>
            <li>
              Guest C asks for Tuesday to Thursday. Because the ranges are half-open, Tuesday is Guest A&apos;s check-out
              day and Guest C&apos;s check-in day without any overlap, so the booking is accepted.
            </li>
          </ol>
        </>
      }
    >
      <TimelineSvg narrow={false} />
      <TimelineSvg narrow />
    </Frame>
  );
}

/* Race sequence ------------------------------------------------------------- */

type Message = { from: number; to: number; label: string; reply?: boolean; tone?: "bad" | "good" };

const LANES = ["Desk A", "Desk B", "Postgres"];

function SequenceSvg({
  title,
  messages,
  gap,
  note,
  result,
  tone,
}: {
  title: string;
  messages: Message[];
  gap?: [number, number];
  note?: { lane: number; after: number; text: string };
  result: string;
  tone: "bad" | "good";
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const width = 380;
  const laneX = [72, 196, 320];
  const head = 56;
  const step = 34;
  const firstY = head + 34;
  const ys = messages.map((m, i) => firstY + i * step + (m.reply ? -6 : 0) + Math.floor(i / 2) * 12);
  const lastY = ys[ys.length - 1] ?? firstY;
  const noteY = note ? lastY + 26 : lastY;
  const resultY = noteY + (note ? 50 : 30);
  const height = resultY + 52;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} aria-hidden focusable="false" className="seq-svg">
      <defs>
        <marker id={`${uid}-a`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="seq-head" />
        </marker>
        <marker id={`${uid}-b`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="seq-head-bad" />
        </marker>
      </defs>
      <text x={0} y={16} className="dg-text dg-strong">
        {title}
      </text>

      {gap ? (
        <g className="dg-fade" style={stagger(2)}>
          <rect x={8} y={ys[gap[0]] - 16} width={width - 16} height={ys[gap[1]] - ys[gap[0]] + 26} rx={8} className="seq-gap" />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            transform={`translate(24 ${(ys[gap[0]] + ys[gap[1]]) / 2}) rotate(-90)`}
            className="dg-mono seq-gap-text"
          >
            the gap
          </text>
        </g>
      ) : null}

      {LANES.map((lane, i) => (
        <g key={lane}>
          <rect x={laneX[i] - 50} y={28} width={100} height={28} rx={14} className="seq-lane" />
          <text x={laneX[i]} y={46.5} textAnchor="middle" className="dg-mono dg-text">
            {lane}
          </text>
          <line x1={laneX[i]} y1={head} x2={laneX[i]} y2={resultY - 12} className="seq-life" />
        </g>
      ))}

      {messages.map((m, i) => {
        const y = ys[i];
        const x1 = laneX[m.from];
        const x2 = laneX[m.to];
        const dir = x2 > x1 ? 1 : -1;
        const bad = m.tone === "bad";
        return (
          <g key={i}>
            <path
              d={`M${x1 + dir * 4} ${y} H${x2 - dir * 6}`}
              pathLength={1}
              markerEnd={`url(#${uid}-${bad ? "b" : "a"})`}
              className={`dg-draw seq-msg ${m.reply ? "seq-reply" : ""} ${bad ? "seq-bad" : ""}`}
              style={stagger(i + 2)}
            />
            <text
              x={(x1 + x2) / 2}
              y={y - 6}
              textAnchor="middle"
              className={`dg-mono dg-fade seq-label ${bad ? "seq-bad-text" : ""}`}
              style={stagger(i + 2)}
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {note ? (
        <g className="dg-fade" style={stagger(messages.length + 2)}>
          <rect x={laneX[note.lane] - 92} y={noteY - 4} width={184} height={30} rx={8} className="seq-note" />
          <text x={laneX[note.lane]} y={noteY + 15} textAnchor="middle" className="dg-mono dg-text">
            {note.text}
          </text>
        </g>
      ) : null}

      <g className="dg-fade" style={stagger(messages.length + 3)}>
        <rect x={8} y={resultY} width={width - 16} height={38} rx={10} className={`seq-result seq-result-${tone}`} />
        <text x={width / 2} y={resultY + 24} textAnchor="middle" className={`dg-text dg-strong seq-result-text-${tone}`}>
          {tone === "bad" ? "✕ " : "✓ "}
          {result}
        </text>
      </g>
    </svg>
  );
}

export function RaceSequence() {
  return (
    <Frame
      className="seq-figure"
      caption="Left: two desks both read before either writes, so both see a free room and both insert. Right: with the exclusion constraint the check and the write are one operation in Postgres, so the second insert fails with 23P01 and the API answers 409."
      description={
        <>
          <p>Two sequence diagrams compare check-then-insert with the database constraint.</p>
          <p>
            Check, then insert: Desk A selects overlapping bookings and gets none. Desk B does the same and also gets
            none. Desk A inserts and succeeds. Desk B inserts and also succeeds. The room now has two bookings for the
            same nights.
          </p>
          <p>
            Exclusion constraint: Desk A inserts and succeeds. Desk B inserts the overlapping stay and Postgres rejects
            it with error 23P01. The API turns that into an HTTP 409 Conflict, so the room keeps one booking and the
            second desk gets a clear refusal.
          </p>
        </>
      }
    >
      <div className="seq-grid">
        <SequenceSvg
          title="Check, then insert"
          tone="bad"
          gap={[0, 5]}
          messages={[
            { from: 0, to: 2, label: "SELECT overlaps" },
            { from: 2, to: 0, label: "0 rows", reply: true },
            { from: 1, to: 2, label: "SELECT overlaps" },
            { from: 2, to: 1, label: "0 rows", reply: true },
            { from: 0, to: 2, label: "INSERT booking" },
            { from: 2, to: 0, label: "OK", reply: true },
            { from: 1, to: 2, label: "INSERT booking" },
            { from: 2, to: 1, label: "OK", reply: true, tone: "bad" },
          ]}
          result="Two bookings, one room"
        />
        <SequenceSvg
          title="Exclusion constraint"
          tone="good"
          messages={[
            { from: 0, to: 2, label: "INSERT booking" },
            { from: 2, to: 0, label: "OK", reply: true },
            { from: 1, to: 2, label: "INSERT booking" },
            { from: 2, to: 1, label: "error 23P01", reply: true, tone: "bad" },
          ]}
          note={{ lane: 1, after: 3, text: "API answers 409 Conflict" }}
          result="One booking, a clear refusal"
        />
      </div>
    </Frame>
  );
}

/* CNN layer stack ----------------------------------------------------------- */

function layerTone(layer: LayerShape): string {
  if (layer.kind === "dense" && layer.name.startsWith("Softmax")) return "cnn-out";
  return `cnn-${layer.kind}`;
}

/** A cuboid for an image-shaped output: face size from the side, depth from the channels. */
function Cuboid({ cx, cy, side, depth, scale, tone }: { cx: number; cy: number; side: number; depth: number; scale: number; tone: string }) {
  const s = side * scale;
  const d = (4 + 3.2 * Math.log2(depth)) * (scale / 3.2);
  const ox = d * 0.55;
  const oy = d * 0.45;
  const x0 = cx - (s + ox) / 2;
  const y0 = cy - (s - oy) / 2;
  return (
    <g className={tone}>
      <path d={`M${x0} ${y0} l${ox} ${-oy} h${s} l${-ox} ${oy} z`} className="cnn-top" />
      <path d={`M${x0 + s} ${y0} l${ox} ${-oy} v${s} l${-ox} ${oy} z`} className="cnn-side" />
      <rect x={x0} y={y0} width={s} height={s} className="cnn-face" />
    </g>
  );
}

function VectorBar({ cx, cy, units, tone, wide }: { cx: number; cy: number; units: number; tone: string; wide: boolean }) {
  const h = (wide ? 11.5 : 3.4) * Math.log2(units);
  const w = wide ? 14 : 10;
  return (
    <g className={tone}>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={3} className="cnn-face" />
    </g>
  );
}

function CnnWide({ layers }: { layers: LayerShape[] }) {
  const slot = 88;
  const width = layers.length * slot;
  const cy = 112;
  const labelY = 214;
  const blockEnd = 7; // input plus three conv and pool blocks
  return (
    <svg viewBox={`0 0 ${width} 262`} className="svg-wide" aria-hidden focusable="false">
      <g className="dg-fade" style={stagger(0)}>
        <path d={`M${slot * 1 + 10} 30 v-8 H${slot * blockEnd - 10} v8`} className="cnn-bracket" />
        <text x={(slot * 1 + slot * blockEnd) / 2} y={13} textAnchor="middle" className="dg-mono dg-muted">
          features: 3 convolution and pooling blocks
        </text>
        <path d={`M${slot * (blockEnd + 1) + 10} 30 v-8 H${width - 10} v8`} className="cnn-bracket" />
        <text x={(slot * (blockEnd + 1) + width) / 2} y={13} textAnchor="middle" className="dg-mono dg-muted">
          classifier
        </text>
      </g>
      <path d={`M10 184 H${width - 14}`} pathLength={1} className="dg-draw cnn-flow" style={stagger(1)} />
      <path d={`M${width - 22} 178 L${width - 12} 184 L${width - 22} 190`} pathLength={1} className="dg-draw cnn-flow" style={stagger(1)} />
      {layers.map((layer, i) => {
        const cx = slot * i + slot / 2;
        return (
          <g key={i} className="dg-pop" style={stagger(i + 1)}>
            {layer.side !== null ? (
              <Cuboid cx={cx} cy={cy} side={layer.side} depth={layer.depth} scale={2.8} tone={layerTone(layer)} />
            ) : (
              <VectorBar cx={cx} cy={cy} units={layer.depth} tone={layerTone(layer)} wide />
            )}
            <text x={cx} y={labelY} textAnchor="middle" className="dg-text dg-strong cnn-name">
              {layer.name}
            </text>
            <text x={cx} y={labelY + 20} textAnchor="middle" className="dg-mono dg-muted">
              {layer.shape}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function CnnNarrow({ layers }: { layers: LayerShape[] }) {
  const rowH = 46;
  const width = 360;
  const height = layers.length * rowH + 8;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="svg-narrow" aria-hidden focusable="false">
      <path d={`M36 10 V${height - 10}`} pathLength={1} className="dg-draw cnn-flow" style={stagger(0)} />
      {layers.map((layer, i) => {
        const cy = i * rowH + rowH / 2 + 4;
        return (
          <g key={i} className="dg-pop" style={stagger(i + 1)}>
            <rect x={6} y={cy - 19} width={60} height={38} rx={8} className="cnn-chip" />
            {layer.side !== null ? (
              <Cuboid cx={36} cy={cy + 1} side={layer.side} depth={layer.depth} scale={1.05} tone={layerTone(layer)} />
            ) : (
              <VectorBar cx={36} cy={cy} units={layer.depth} tone={layerTone(layer)} wide={false} />
            )}
            <text x={80} y={cy + 5} className="dg-text dg-strong">
              {layer.name}
            </text>
            <text x={width - 4} y={cy + 5} textAnchor="end" className="dg-mono dg-muted">
              {layer.shape}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function CnnLayers() {
  const layers = layerShapes(HANDWRITING_CNN);
  const params = totalParams(layers).toLocaleString("en-GB");
  return (
    <Frame
      className="svg-figure-cnn"
      caption={`The model from model.py, layer by layer, with each output shape. Convolutions keep or trim the size, each pooling step halves it, and the filters grow from 32 to 128 before the dense layers end in 26 letter probabilities. ${params} trainable parameters in all.`}
      description={
        <>
          <p>The layers of the network in order, with the shape each one outputs.</p>
          <ol>
            {layers.map((layer, i) => (
              <li key={i}>
                {layer.name}: {layer.shape}
                {layer.params ? `, ${layer.params.toLocaleString("en-GB")} parameters` : ""}
              </li>
            ))}
          </ol>
        </>
      }
    >
      <CnnWide layers={layers} />
      <CnnNarrow layers={layers} />
    </Frame>
  );
}
