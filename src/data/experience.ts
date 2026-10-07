/**
 * Experience dates checked against the owner's LinkedIn on 7 October 2026.
 * See docs/PROFILE_SOURCES.md. Persmon's date describes organisation tenure,
 * not the date of founding or appointment as COO.
 */

export interface ExperienceEntry {
  organisation: string;
  role: string;
  description: string;
  href: string | null;
  startYear: number | null;
  endYear: number | null;
  periodLabel?: string;
  kind: "work" | "education";
}

export const experience: readonly ExperienceEntry[] = [
  {
    organisation: "Persmon Technologies",
    role: "Co-founder and COO",
    description: "A Kampala software company with 47 projects in its portfolio, from hotel systems to civic data.",
    href: "https://persmontechnologies.com",
    startYear: 2022,
    endYear: null,
    periodLabel: "With Persmon since 2022",
    kind: "work",
  },
  {
    organisation: "Learnnovate Africa",
    role: "Founder and programme director",
    description: "A non-profit that teaches technology skills.",
    href: "https://github.com/Learnnovate-Africa",
    startYear: 2022,
    endYear: null,
    kind: "work",
  },
  {
    organisation: "Uganda Christian University",
    role: "BSc Computer Science, First Class Honours",
    description: "Undergraduate degree in computer science.",
    href: null,
    startYear: 2022,
    endYear: 2024,
    kind: "education",
  },
];

/** "2021 to 2024", "2021 to now", "2024", or null when no year is known. */
export function experienceYears(entry: ExperienceEntry): string | null {
  if (entry.periodLabel) return entry.periodLabel;
  if (entry.startYear === null && entry.endYear === null) return null;
  if (entry.startYear !== null && entry.endYear === null) return `${entry.startYear} to now`;
  if (entry.startYear === null) return String(entry.endYear);
  return entry.startYear === entry.endYear ? String(entry.startYear) : `${entry.startYear} to ${entry.endYear}`;
}
