/**
 * Experience and education for the portfolio. Years are null until the owner
 * confirms them; the pages render the entries without years while they are.
 */

export interface ExperienceEntry {
  organisation: string;
  role: string;
  description: string;
  href: string | null;
  startYear: number | null;
  endYear: number | null;
  kind: "work" | "education";
}

export const experience: readonly ExperienceEntry[] = [
  {
    organisation: "Persmon Technologies",
    role: "Co-founder and COO",
    description: "A Kampala software company with 47 shipped projects, from hotel systems to civic data.",
    href: "https://persmontechnologies.com",
    startYear: null,
    endYear: null,
    kind: "work",
  },
  {
    organisation: "Learnnovate Africa",
    role: "Building a non-profit",
    description: "A non-profit that teaches technology skills.",
    href: "https://github.com/Learnnovate-Africa",
    startYear: null,
    endYear: null,
    kind: "work",
  },
  {
    organisation: "Uganda Christian University",
    role: "BSc Computer Science, First Class Honours",
    description: "Undergraduate degree in computer science.",
    href: null,
    startYear: null,
    endYear: null,
    kind: "education",
  },
];

/** "2021 to 2024", "2021 to now", "2024", or null when no year is known. */
export function experienceYears(entry: ExperienceEntry): string | null {
  if (entry.startYear === null && entry.endYear === null) return null;
  if (entry.startYear !== null && entry.endYear === null) return `${entry.startYear} to now`;
  if (entry.startYear === null) return String(entry.endYear);
  return entry.startYear === entry.endYear ? String(entry.startYear) : `${entry.startYear} to ${entry.endYear}`;
}
