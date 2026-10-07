/**
 * Small pure formatters shared by the blog pages and the social cards.
 * Dates are calendar dates (YYYY-MM-DD) and are always read as UTC so a
 * post never shows a different day on a server in another time zone.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** "7 October 2026" */
export function formatDate(isoDate: string): string {
  return DATE_FORMAT.format(toUtcDate(isoDate));
}

/** "7 Oct", for the year-grouped post list where the year is the heading. */
export function formatShortDate(isoDate: string): string {
  return SHORT_DATE_FORMAT.format(toUtcDate(isoDate));
}

/** "8 min read" */
export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}

/** The kicker above a post title: its series part, or else its first tag. */
export function postKicker(post: { series: { name: string; part: number } | null; tags: string[] }): string {
  if (post.series) return `${post.series.name}, part ${post.series.part}`;
  return post.tags[0] ? tagLabel(post.tags[0]) : "Writing";
}

/** Names whose spelling a plain capitalisation would get wrong. */
const TAG_NAMES: Readonly<Record<string, string>> = {
  nextjs: "Next.js",
  typescript: "TypeScript",
  javascript: "JavaScript",
  postgres: "Postgres",
  postgresql: "PostgreSQL",
  prisma: "Prisma",
  docker: "Docker",
  coolify: "Coolify",
  react: "React",
  ai: "AI",
  mlops: "MLOps",
  sql: "SQL",
  api: "API",
  pwa: "PWA",
  "self-hosting": "Self-hosting",
  whatsapp: "WhatsApp",
  opencv: "OpenCV",
};

/** Tags are kebab-case in frontmatter; shown as capitalised words ("data-modelling" is "Data modelling"). */
export function tagLabel(tag: string): string {
  const known = TAG_NAMES[tag];
  if (known) return known;
  const text = tag.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
