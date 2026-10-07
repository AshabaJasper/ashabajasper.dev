import { awards, skillGroups } from "@/data/cv";
import { experience, experiencePeriod } from "@/data/experience";
import { profile } from "@/data/profile";
import { allWork, featuredWork, sectorYear, work, workBySlug, workKinds, type WorkItem, type WorkKind } from "@/data/work";

/**
 * The command engine behind the home page terminal. Pure: it turns a line of
 * input into lines of output and an optional effect, using only the facts in
 * src/data. Nothing is invented here; every number is counted from the data.
 */

export interface TermPart {
  text: string;
  /** A same-host path ("/work/hms"), an absolute URL or a mailto: link. */
  href?: string;
  tone?: "accent" | "muted" | "info" | "error" | "strong";
}

export type TermLine = TermPart[];

export type TermEffect =
  | { type: "clear" }
  | { type: "theme"; value: "light" | "dark" | "toggle" }
  | { type: "navigate"; href: string };

export interface TermResult {
  lines: TermLine[];
  effect?: TermEffect;
}

export interface TermPost {
  title: string;
  date: string;
  href: string;
}

export interface TermContext {
  posts: readonly TermPost[];
  /** The writing index, an absolute URL on the blog host. */
  blogHref: string;
  /** Earlier commands, oldest first, for `history`. */
  history?: readonly string[];
}

const t = (text: string, tone?: TermPart["tone"], href?: string): TermPart => ({ text, tone, href });
const line = (...parts: (TermPart | string)[]): TermLine => parts.map((p) => (typeof p === "string" ? { text: p } : p));
const blank: TermLine = [];

interface CommandSpec {
  name: string;
  usage: string;
  description: string;
}

/** Shown by `help`; the easter eggs are deliberately left out. */
export const COMMANDS: readonly CommandSpec[] = [
  { name: "help", usage: "help", description: "List the commands" },
  { name: "whoami", usage: "whoami", description: "Who built this" },
  { name: "projects", usage: "projects [kind]", description: "The work, by kind: systems, websites, ecommerce, mobile, all" },
  { name: "project", usage: "project <slug>", description: "One project in detail" },
  { name: "open", usage: "open <slug|page>", description: "Go to a case study or a page" },
  { name: "experience", usage: "experience", description: "Roles, newest first" },
  { name: "skills", usage: "skills [group]", description: "Skills by category, from the CV" },
  { name: "cv", usage: "cv", description: "Open the full CV" },
  { name: "stack", usage: "stack", description: "Technologies, counted across the projects" },
  { name: "blog", usage: "blog", description: "Latest writing" },
  { name: "contact", usage: "contact", description: "Email and profiles" },
  { name: "theme", usage: "theme [light|dark]", description: "Switch the colour theme" },
  { name: "clear", usage: "clear", description: "Clear the screen" },
];

const HIDDEN = ["ls", "cd", "pwd", "sudo", "history", "echo", "exit", "rm", "date"];

const PAGES: Record<string, string> = {
  home: "/",
  work: "/work",
  about: "/about",
  now: "/now",
  contact: "/contact",
  cv: "/cv",
  privacy: "/privacy",
  terms: "/terms",
};

const KIND_ALIASES: Record<string, WorkKind | "all"> = {
  all: "all",
  system: "system",
  systems: "system",
  website: "website",
  websites: "website",
  site: "website",
  sites: "website",
  ecommerce: "ecommerce",
  "e-commerce": "ecommerce",
  shop: "ecommerce",
  shops: "ecommerce",
  store: "ecommerce",
  mobile: "mobile",
  apps: "mobile",
  app: "mobile",
};

function kindLabel(kind: WorkKind): string {
  return workKinds.find((k) => k.kind === kind)?.label ?? kind;
}

/** Where a project leads: its case study, or its row in the full list. */
export function projectHref(item: Pick<WorkItem, "slug" | "featured">): string {
  return item.featured ? `/work/${item.slug}` : `/work#${item.slug}`;
}

/** Technologies with how many projects use each, most used first. */
export function stackCounts(items: readonly WorkItem[] = work): { tech: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) for (const tech of new Set(item.stack)) counts.set(tech, (counts.get(tech) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tech, count]) => ({ tech, count }))
    .sort((a, b) => b.count - a.count || a.tech.localeCompare(b.tech));
}

/** Small edit distance for "did you mean". */
function distance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

function closest(input: string, options: readonly string[]): string | null {
  const prefix = options.find((o) => o.startsWith(input));
  if (prefix) return prefix;
  let best: string | null = null;
  let bestScore = Infinity;
  for (const option of options) {
    const score = distance(input, option);
    if (score < bestScore) {
      best = option;
      bestScore = score;
    }
  }
  return best !== null && bestScore <= Math.max(2, Math.floor(input.length / 3)) ? best : null;
}

function whoami(): TermLine[] {
  const now = profile.currently.map((c) => `${c.role}, ${c.name}`);
  return [
    line(t(profile.name, "strong"), t(`  ${profile.location}`, "muted")),
    line(t(profile.headline, "info")),
    blank,
    line(profile.about),
    blank,
    line(t("now      ", "muted"), now[0] ?? ""),
    ...now.slice(1).map((n) => line(t("         ", "muted"), n)),
    line(t("studied  ", "muted"), profile.education.degree),
    line(t("         ", "muted"), `${profile.education.school}, GPA ${profile.education.gpa}`),
    line(t("learning ", "muted"), profile.exploring.join(", ")),
    blank,
    line(t("More: ", "muted"), t("experience", "accent"), t(", ", "muted"), t("skills", "accent"), t(", ", "muted"), t("projects", "accent"), t(" or ", "muted"), t("cv", "accent", "/cv"), t(".", "muted")),
  ];
}

function experienceLines(): TermLine[] {
  const roles = experience.filter((e) => e.kind !== "education");
  return [
    line(t("Experience", "strong"), t("  newest first", "muted")),
    blank,
    ...roles.flatMap((e) => [
      line(t(experiencePeriod(e).padEnd(22), "muted"), t(e.role, "accent")),
      line(t("".padEnd(22)), e.organisation + (e.remote ? " (remote)" : "")),
    ]),
    blank,
    line(t("Highlights and education on ", "muted"), t("/cv", "accent", "/cv"), t(".", "muted")),
  ];
}

function skills(arg: string | undefined): TermLine[] {
  if (arg) {
    const key = arg.toLowerCase();
    const group = skillGroups.find((g) => g.id === key || g.label.toLowerCase().includes(key));
    if (!group) return [line(t(`skills: no group "${arg}". Groups: ${skillGroups.map((g) => g.id).join(", ")}`, "error"))];
    return [line(t(group.label, "strong")), ...group.items.map((item) => line(t("  ", "muted"), item))];
  }
  const width = Math.max(...skillGroups.map((g) => g.id.length)) + 2;
  return [
    line(t("Skills, from the CV", "strong")),
    blank,
    ...skillGroups.map((g) => line(t(g.id.padEnd(width), "accent"), t(g.items.slice(0, 5).join(", ") + (g.items.length > 5 ? ` +${g.items.length - 5}` : ""), "muted"))),
    blank,
    line(t("Try ", "muted"), t("skills ml", "accent"), t(`. ${awards.length} awards and the certifications are on `, "muted"), t("/cv", "accent", "/cv"), t(".", "muted")),
  ];
}

function help(): TermLine[] {
  const width = Math.max(...COMMANDS.map((c) => c.usage.length)) + 2;
  return [
    line(t("Commands", "strong")),
    ...COMMANDS.map((c) => line(t(c.usage.padEnd(width), "accent"), t(c.description, "muted"))),
    blank,
    line(t("Tab completes, the arrow keys walk the history. Ctrl K opens the command palette.", "muted")),
  ];
}

function projects(arg: string | undefined): TermLine[] {
  if (!arg) {
    const featured = featuredWork();
    const slugWidth = Math.max(...featured.map((f) => f.slug.length)) + 2;
    return [
      line(t(`${work.length} projects`, "strong"), t(", all built at Persmon Technologies.", "muted")),
      blank,
      line(t("Case studies", "muted")),
      ...featured.map((f) => line(t(f.slug.padEnd(slugWidth), "accent", projectHref(f)), f.name)),
      blank,
      line(t("By kind", "muted")),
      ...workKinds.map(({ kind, label }) =>
        line(t(label.padEnd(13)), t(String(work.filter((w) => w.kind === kind).length).padStart(3), "info")),
      ),
      blank,
      line(t("Try ", "muted"), t("project hms", "accent"), t(" or ", "muted"), t("projects mobile", "accent"), t(".", "muted")),
    ];
  }
  const kind = KIND_ALIASES[arg.toLowerCase()];
  if (!kind) {
    return [line(t(`projects: unknown kind "${arg}". Use systems, websites, ecommerce, mobile or all.`, "error"))];
  }
  const items = allWork().filter((w) => kind === "all" || w.kind === kind);
  const slugWidth = Math.min(28, Math.max(...items.map((w) => w.slug.length)) + 2);
  return [
    line(t(kind === "all" ? `All ${items.length} projects` : `${kindLabel(kind)}: ${items.length}`, "strong")),
    ...items.map((w) => line(t(w.slug.padEnd(slugWidth), "accent", projectHref(w)), t(sectorYear(w), "muted"))),
  ];
}

function project(slug: string | undefined): TermLine[] {
  if (!slug) return [line(t("usage: project <slug>. Run projects to see the slugs.", "error"))];
  const item = workBySlug(slug.toLowerCase());
  if (!item) {
    const guess = closest(slug.toLowerCase(), work.map((w) => w.slug));
    return [
      line(t(`project: no project called "${slug}".`, "error")),
      ...(guess ? [line(t("Did you mean ", "muted"), t(`project ${guess}`, "accent"), t("?", "muted"))] : []),
    ];
  }
  const rows: TermLine[] = [
    line(t(item.name, "strong")),
    line(t([kindLabel(item.kind), item.sector, ...(item.year === null ? [] : [String(item.year)])].join(" · "), "muted")),
    blank,
    line(item.caseStudy?.headline ?? item.summary),
  ];
  if (item.caseStudy) rows.push(line(t(item.summary, "muted")));
  rows.push(blank);
  if (item.stack.length) rows.push(line(t("stack  ", "muted"), item.stack.join(", ")));
  if (item.url) rows.push(line(t("live   ", "muted"), t(item.url.replace(/^https:\/\//, ""), "info", item.url)));
  rows.push(
    item.featured
      ? line(t("read   ", "muted"), t("the case study", "accent", projectHref(item)), t(` (open ${item.slug})`, "muted"))
      : line(t("list   ", "muted"), t("see it in the full list", "accent", projectHref(item))),
  );
  return rows;
}

function stack(): TermLine[] {
  const counts = stackCounts();
  const top = counts.slice(0, 10);
  const max = top[0]?.count ?? 1;
  const width = Math.max(...top.map((c) => c.tech.length)) + 2;
  return [
    line(t("Most used across the projects", "strong"), t(`  ${work.length} projects shipped`, "muted")),
    blank,
    ...top.map((c) =>
      line(t(c.tech.padEnd(width)), t("█".repeat(Math.max(1, Math.round((c.count / max) * 18))), "accent"), t(` ${c.count}`, "info")),
    ),
    blank,
    line(t(`${counts.length} technologies across the portfolio. Going deeper into: `, "muted"), profile.exploring.join(", ")),
  ];
}

function blog(ctx: TermContext): TermLine[] {
  if (ctx.posts.length === 0) return [line("No posts yet. "), line(t("Writing", "accent", ctx.blogHref))];
  return [
    line(t("Latest writing", "strong")),
    ...ctx.posts.slice(0, 5).map((p) => line(t(`${p.date}  `, "muted"), t(p.title, "accent", p.href))),
    blank,
    line(t("All writing: ", "muted"), t(ctx.blogHref.replace(/^https?:\/\//, ""), "info", ctx.blogHref)),
  ];
}

function contact(): TermLine[] {
  return [
    line(t("email    ", "muted"), t(profile.email, "accent", `mailto:${profile.email}`)),
    line(t("form     ", "muted"), t("/contact", "accent", "/contact")),
    line(t("github   ", "muted"), t("AshabaJasper", "info", profile.links.github)),
    line(t("linkedin ", "muted"), t("ashaba-jasper-joshua", "info", profile.links.linkedin)),
    line(t("x        ", "muted"), t(profile.xHandle, "info", profile.links.x)),
    line(t("based in ", "muted"), profile.location),
  ];
}

function ls(arg: string | undefined, ctx: TermContext): TermLine[] {
  if (arg && /^work\/?$/.test(arg)) return projects("all").slice(1);
  if (arg && /^writing\/?$/.test(arg)) return blog(ctx);
  return [
    line(
      t("work/", "info", "/work"),
      "  ",
      t("writing/", "info", ctx.blogHref),
      "  ",
      t("about.md", undefined, "/about"),
      "  ",
      t("now.md", undefined, "/now"),
      "  ",
      t("contact.txt", undefined, "/contact"),
    ),
  ];
}

/** Run one line of input. Unknown commands get a hint, never a crash. */
export function runCommand(input: string, ctx: TermContext): TermResult {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [] };
  const [rawName, ...args] = trimmed.split(/\s+/);
  const name = rawName.toLowerCase();
  const arg = args[0];

  switch (name) {
    case "help":
    case "man":
    case "?":
      return { lines: help() };
    case "whoami":
      return { lines: whoami() };
    case "projects":
      return { lines: projects(arg) };
    case "project":
      return { lines: project(arg) };
    case "stack":
      return { lines: stack() };
    case "experience":
    case "jobs":
      return { lines: experienceLines() };
    case "skills":
      return { lines: skills(arg) };
    case "cv":
    case "resume":
      return { lines: [line(t("Opening the CV.", "muted"))], effect: { type: "navigate", href: "/cv" } };
    case "blog":
    case "writing":
      return { lines: blog(ctx) };
    case "contact":
      return { lines: contact() };
    case "clear":
    case "cls":
      return { lines: [], effect: { type: "clear" } };
    case "theme": {
      const value = arg === "light" || arg === "dark" ? arg : "toggle";
      return { lines: [line(t(value === "toggle" ? "Theme switched." : `Theme set to ${value}.`, "muted"))], effect: { type: "theme", value } };
    }
    case "open":
    case "cd": {
      if (!arg || arg === "~" || arg === "/") {
        return name === "cd" ? { lines: [], effect: { type: "navigate", href: "/" } } : { lines: [line(t("usage: open <slug|page>", "error"))] };
      }
      const key = arg.toLowerCase().replace(/^\/+|\/+$/g, "").replace(/\.(md|txt)$/, "");
      if (key === "writing" || key === "blog") return { lines: [line(t("Opening the writing.", "muted"))], effect: { type: "navigate", href: ctx.blogHref } };
      if (PAGES[key]) return { lines: [line(t(`Opening ${PAGES[key]}`, "muted"))], effect: { type: "navigate", href: PAGES[key] } };
      const item = workBySlug(key.replace(/^work\//, ""));
      if (item) return { lines: [line(t(`Opening ${item.name}`, "muted"))], effect: { type: "navigate", href: projectHref(item) } };
      const guess = closest(key, [...Object.keys(PAGES), ...work.map((w) => w.slug)]);
      return {
        lines: [
          line(t(`${name}: ${arg}: no such page or project`, "error")),
          ...(guess ? [line(t("Did you mean ", "muted"), t(`${name} ${guess}`, "accent"), t("?", "muted"))] : []),
        ],
      };
    }
    case "ls":
      return { lines: ls(arg, ctx) };
    case "pwd":
      return { lines: [line("/home/visitor")] };
    case "date":
      return { lines: [line(t("Time in Kampala is East Africa Time, UTC+3.", "muted"))] };
    case "echo":
      return { lines: [line(args.join(" "))] };
    case "history":
      return {
        lines: (ctx.history ?? []).map((h, i) => line(t(String(i + 1).padStart(4) + "  ", "muted"), h)),
      };
    case "sudo":
      return {
        lines: [
          line(t("visitor is not in the sudoers file.", "error")),
          line(t("This incident will be reported to nobody. Try ", "muted"), t("contact", "accent"), t(" instead.", "muted")),
        ],
      };
    case "rm":
      return { lines: [line(t("rm: this is a read-only portfolio. Everything here stays.", "error"))] };
    case "exit":
    case "logout":
      return { lines: [line(t("There is no exit, only ", "muted"), t("contact", "accent"), t(".", "muted"))] };
    default: {
      const guess = closest(name, [...COMMANDS.map((c) => c.name), ...HIDDEN]);
      return {
        lines: [
          line(t(`command not found: ${rawName}`, "error")),
          line(
            ...(guess ? [t("Did you mean ", "muted"), t(guess, "accent"), t("? ", "muted")] : []),
            t("Type ", "muted"),
            t("help", "accent"),
            t(" for the list.", "muted"),
          ),
        ],
      };
    }
  }
}

/** Tab completion: the completed input, or null when nothing fits uniquely. */
export function completeCommand(input: string): string | null {
  const parts = input.replace(/^\s+/, "").split(/\s+/);
  if (parts.length === 1) {
    const names = [...COMMANDS.map((c) => c.name), ...HIDDEN].filter((n) => n.startsWith(parts[0].toLowerCase()));
    return names.length === 1 ? `${names[0]} ` : commonPrefix(names, parts[0]);
  }
  if (parts.length === 2) {
    const cmd = parts[0].toLowerCase();
    const options =
      cmd === "project"
        ? work.map((w) => w.slug)
        : cmd === "open" || cmd === "cd"
          ? [...Object.keys(PAGES), "writing", ...work.map((w) => w.slug)]
          : cmd === "projects"
            ? ["all", "systems", "websites", "ecommerce", "mobile"]
            : cmd === "theme"
              ? ["light", "dark"]
              : cmd === "skills"
                ? skillGroups.map((g) => g.id)
              : [];
    const matches = options.filter((o) => o.startsWith(parts[1].toLowerCase()));
    if (matches.length === 1) return `${parts[0]} ${matches[0]}`;
    const prefix = commonPrefix(matches, parts[1]);
    return prefix === null ? null : `${parts[0]} ${prefix}`;
  }
  return null;
}

function commonPrefix(options: string[], typed: string): string | null {
  if (options.length === 0) return null;
  let prefix = options[0];
  for (const o of options) while (!o.startsWith(prefix)) prefix = prefix.slice(0, -1);
  return prefix.length > typed.length ? prefix : null;
}

/** What the terminal shows before anyone types: the whoami intro. */
export const INTRO_COMMAND = "whoami";
