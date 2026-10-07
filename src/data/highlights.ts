import { experience, type YearMonth } from "@/data/experience";
import { sectors, work } from "@/data/work";

/**
 * The "by the numbers" figures. Counts come from src/data; the rest are the
 * CV's own figures, each attributed to the project or role it belongs to.
 * Pure, with `now` passed in, so tests can pin every value.
 */

export interface Highlight {
  id: string;
  value: number;
  decimals?: number;
  suffix?: string;
  label: string;
  /** Where the figure comes from, shown under it. */
  source: string;
  icon: "layers" | "building" | "calendar" | "users" | "target" | "graduation" | "school";
}

/** The first month of paid software work in the CV. */
export function firstShipped(): YearMonth {
  const starts = experience.filter((e) => e.kind === "work" && e.start !== null).map((e) => e.start!);
  return starts.reduce((a, b) => (a.year * 12 + a.month <= b.year * 12 + b.month ? a : b));
}

/** Whole years from the first shipped role to `now`. */
export function yearsShipping(now: YearMonth): number {
  const start = firstShipped();
  return Math.floor((now.year * 12 + now.month - (start.year * 12 + start.month)) / 12);
}

export function highlights(now: YearMonth): Highlight[] {
  return [
    { id: "projects", value: work.length, label: "projects shipped", source: "Persmon Technologies portfolio", icon: "layers" },
    { id: "sectors", value: sectors.length, label: "sectors served", source: "From hotels to civic data", icon: "building" },
    {
      id: "years",
      value: yearsShipping(now),
      suffix: "+",
      label: "years shipping software",
      source: `Since ${firstShipped().year}`,
      icon: "calendar",
    },
    { id: "accuracy", value: 97.9, decimals: 1, suffix: "%", label: "validated accuracy", source: "RadCareLoop, Envision Radiology", icon: "target" },
    { id: "users", value: 270, suffix: "+", label: "active users", source: "Help Anonymous, capstone app", icon: "users" },
    { id: "gdsc", value: 100, suffix: "+", label: "students led", source: "Google Developer Student Club", icon: "graduation" },
    { id: "learners", value: 200, suffix: "+", label: "learners reached", source: "Learnnovate programmes", icon: "school" },
  ];
}

/** Employers and organisations named in the CV, shown as plain text wordmarks. */
export const WORKED_WITH: readonly { name: string; note?: string }[] = [
  { name: "Envision Radiology", note: "via Reveloop" },
  { name: "MTN Uganda" },
  { name: "Uganda Bookshop" },
  { name: "Excellent Shop" },
  { name: "Centenary Publishing" },
  { name: "Blue Pearls" },
  { name: "Persmon Technologies" },
  { name: "Google Developer Student Clubs" },
];
