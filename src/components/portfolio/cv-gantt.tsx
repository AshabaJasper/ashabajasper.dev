"use client";

import { useEffect, useRef, useState } from "react";
import type { ExperienceKind, YearMonth } from "@/data/experience";

export interface GanttRow {
  id: string;
  role: string;
  organisation: string;
  kind: ExperienceKind;
  start: YearMonth | null;
  end: YearMonth | "present";
  period: string;
  months: number | null;
}

const KIND_COLOR: Record<ExperienceKind, string> = {
  work: "var(--viz-system)",
  education: "var(--viz-mobile)",
  community: "var(--viz-ecommerce)",
};

const KIND_LABEL: Record<ExperienceKind, string> = {
  work: "Work",
  education: "Education",
  community: "Community",
};

const ROW = 34;
const AXIS = 30;

function toIndex(value: YearMonth): number {
  return value.year * 12 + (value.month - 1);
}

/**
 * The CV as a timeline chart: one bar per role, from its first to its last
 * month, on a shared year axis. Overlaps are real (several roles ran side by
 * side). A role without a known start is drawn as an open-ended marker, not
 * a guessed bar. Each bar links to its entry below. Bars grow in once when
 * scrolled into view, unless motion is reduced.
 */
export function CvGantt({ rows, now }: { rows: readonly GanttRow[]; now: YearMonth }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1000);
  const [drawn, setDrawn] = useState(true);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return () => ro.disconnect();
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) return () => ro.disconnect();
    setDrawn(false);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const starts = rows.filter((r) => r.start !== null).map((r) => toIndex(r.start!));
  const firstYear = Math.floor(Math.min(...starts) / 12);
  const min = firstYear * 12;
  const max = toIndex(now) + 1;
  const narrow = width < 640;
  const labelWidth = narrow ? 0 : 230;
  const plot = width - labelWidth - 8;
  const x = (index: number) => labelWidth + ((index - min) / (max - min)) * plot;
  const rowHeight = narrow ? ROW + 16 : ROW;
  const height = AXIS + rows.length * rowHeight + 6;
  const years: number[] = [];
  for (let y = firstYear; y <= now.year; y++) years.push(y);

  return (
    <div>
      <ul className="text-muted-foreground mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem]" aria-label="Legend">
        {(Object.keys(KIND_LABEL) as ExperienceKind[]).map((kind) => (
          <li key={kind} className="inline-flex items-center gap-2">
            <span aria-hidden className="inline-block h-2.5 w-5 rounded-full" style={{ background: KIND_COLOR[kind] }} />
            {KIND_LABEL[kind]}
          </li>
        ))}
        <li className="inline-flex items-center gap-2">
          <svg aria-hidden width="22" height="10" viewBox="0 0 22 10">
            <line x1="1" y1="5" x2="16" y2="5" stroke="var(--muted-foreground)" strokeWidth="2" strokeDasharray="2 3" />
            <circle cx="18" cy="5" r="3.5" fill="var(--muted-foreground)" />
          </svg>
          Start not listed
        </li>
      </ul>
      <div ref={wrapRef} className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          className="block h-auto overflow-visible"
          role="group"
          aria-label={`Timeline of ${rows.length} roles from ${firstYear} to ${now.year}. Each bar links to the role below.`}
        >
          {years.map((year) => (
            <g key={year}>
              <line x1={x(year * 12)} x2={x(year * 12)} y1={AXIS - 8} y2={height} stroke="var(--rule)" strokeWidth={1} />
              <text x={x(year * 12) + 4} y={AXIS - 14} className="fill-muted-foreground font-mono text-[11px]">
                {narrow && year % 2 === 1 ? "" : year}
              </text>
            </g>
          ))}
          <line x1={x(max)} x2={x(max)} y1={AXIS - 8} y2={height} stroke="var(--primary)" strokeWidth={1} strokeDasharray="3 3" />

          {rows.map((row, i) => {
            const top = AXIS + i * rowHeight + (narrow ? 16 : 0);
            const end = row.end === "present" ? max : toIndex(row.end) + 1;
            const start = row.start ? toIndex(row.start) : null;
            const color = KIND_COLOR[row.kind];
            const label = `${row.role}, ${row.organisation}. ${row.period}${row.months ? `, ${row.months} months` : ""}.`;
            const active = hover === row.id;
            return (
              <a
                key={row.id}
                href={`#exp-${row.id}`}
                aria-label={label}
                onMouseEnter={() => setHover(row.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(row.id)}
                onBlur={() => setHover(null)}
                className="group outline-none"
              >
                <rect x={0} y={top - (narrow ? 16 : 0)} width={width} height={rowHeight} fill={active ? "var(--muted)" : "transparent"} rx={6} />
                {narrow ? (
                  <text x={0} y={top - 3} className="fill-foreground text-[11.5px]">
                    {row.organisation.length > 44 ? `${row.organisation.slice(0, 42)}...` : row.organisation}
                  </text>
                ) : (
                  <text x={0} y={top + rowHeight / 2 + 4} className="fill-foreground text-[12.5px]">
                    {row.organisation.length > 32 ? `${row.organisation.slice(0, 30)}...` : row.organisation}
                  </text>
                )}
                {start !== null ? (
                  <rect
                    x={x(start)}
                    y={top + (narrow ? 6 : 10)}
                    width={Math.max(4, x(end) - x(start))}
                    height={narrow ? 14 : 14}
                    rx={7}
                    fill={color}
                    stroke={active ? "var(--foreground)" : "none"}
                    strokeWidth={1.5}
                    style={{
                      transformOrigin: `${x(start)}px 0`,
                      transform: drawn ? "scaleX(1)" : "scaleX(0)",
                      transition: `transform 900ms cubic-bezier(0.2, 0.75, 0.15, 1) ${i * 70}ms`,
                    }}
                  />
                ) : (
                  <g>
                    <line x1={x(max) - 60} x2={x(max) - 6} y1={top + (narrow ? 13 : 17)} y2={top + (narrow ? 13 : 17)} stroke={color} strokeWidth={2} strokeDasharray="2 3" />
                    <circle cx={x(max) - 3} cy={top + (narrow ? 13 : 17)} r={5} fill={color} />
                  </g>
                )}
              </a>
            );
          })}
        </svg>
      </div>
      <p className="text-muted-foreground mt-3 font-mono text-[0.72rem]">
        Months from the CV. The dashed line is {new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(now.year, now.month - 1, 1)))}.
      </p>
    </div>
  );
}
