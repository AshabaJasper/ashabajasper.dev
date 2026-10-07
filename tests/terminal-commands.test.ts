import { describe, expect, it } from "vitest";
import { COMMANDS, completeCommand, projectHref, runCommand, stackCounts, type TermLine } from "@/components/portfolio/terminal-commands";
import { experience } from "@/data/experience";
import { profile } from "@/data/profile";
import { featuredWork, work } from "@/data/work";

const ctx = {
  posts: [{ title: "Making double bookings impossible", date: "2026-10-07", href: "https://blog.example/x" }],
  blogHref: "https://blog.example/",
};
const text = (lines: TermLine[]) => lines.map((l) => l.map((p) => p.text).join("")).join("\n");

describe("terminal commands", () => {
  it("lists every documented command in help", () => {
    const out = text(runCommand("help", ctx).lines);
    for (const c of COMMANDS) expect(out).toContain(c.usage);
  });

  it("whoami uses the profile facts", () => {
    const out = text(runCommand("whoami", ctx).lines);
    expect(out).toContain(profile.name);
    expect(out).toContain(profile.headline);
    expect(out).toContain(profile.education.gpa);
    expect(out).toContain("Founder and Program Director, Learnnovate");
  });

  it("projects counts every kind and links the case studies", () => {
    const result = runCommand("projects", ctx);
    expect(text(result.lines)).toContain(`${work.length} projects`);
    const links = result.lines.flat().filter((p) => p.href).map((p) => p.href);
    for (const f of featuredWork()) expect(links).toContain(`/work/${f.slug}`);
    expect(text(runCommand("projects mobile", ctx).lines)).toContain("Mobile apps: 3");
    expect(runCommand("projects all", ctx).lines).toHaveLength(work.length + 1);
  });

  it("project shows real details, and suggests a slug for a typo", () => {
    const out = text(runCommand("project hms", ctx).lines);
    expect(out).toContain("HMS: Hotel Management System");
    expect(out).toContain("hms.persmon.cloud");
    expect(text(runCommand("project hsm", ctx).lines)).toMatch(/Did you mean project (hms|oms)/);
    expect(text(runCommand("project centenary-publishing", ctx).lines)).toContain("see it in the full list");
  });

  it("never invents a year or a stack, and never apologises for one", () => {
    const undated = work.find((w) => w.year === null && w.stack.length === 0)!;
    const out = text(runCommand(`project ${undated.slug}`, ctx).lines);
    expect(out).toContain(undated.sector);
    expect(out).not.toMatch(/20\d\d/);
    expect(out).not.toMatch(/not listed|unknown|stack /i);
  });

  it("stack counts come from the data, with no caveats", () => {
    const counts = stackCounts();
    const out = text(runCommand("stack", ctx).lines);
    expect(out).toContain(counts[0].tech);
    expect(out).toContain(`${work.length} projects shipped`);
    expect(out).toContain(`${counts.length} technologies`);
    expect(out).not.toMatch(/not counted|not listed/i);
  });

  it("experience and skills come from the CV data", () => {
    const out = text(runCommand("experience", ctx).lines);
    for (const e of experience.filter((x) => x.kind !== "education")) expect(out).toContain(e.role);
    expect(text(runCommand("skills ml", ctx).lines)).toContain("PyTorch");
    expect(text(runCommand("skills nonsense", ctx).lines)).toContain("no group");
  });

  it("returns effects for clear, theme and navigation", () => {
    expect(runCommand("clear", ctx).effect).toEqual({ type: "clear" });
    expect(runCommand("theme dark", ctx).effect).toEqual({ type: "theme", value: "dark" });
    expect(runCommand("theme", ctx).effect).toEqual({ type: "theme", value: "toggle" });
    expect(runCommand("cv", ctx).effect).toEqual({ type: "navigate", href: "/cv" });
    expect(runCommand("open oms", ctx).effect).toEqual({ type: "navigate", href: "/work/oms" });
    expect(runCommand("cd writing", ctx).effect).toEqual({ type: "navigate", href: ctx.blogHref });
    expect(runCommand("open nowhere-at-all", ctx).effect).toBeUndefined();
  });

  it("handles easter eggs and unknown commands without throwing", () => {
    expect(text(runCommand("sudo rm -rf /", ctx).lines)).toContain("sudoers");
    expect(text(runCommand("helo", ctx).lines)).toContain("Did you mean help");
    expect(runCommand("   ", ctx).lines).toEqual([]);
  });

  it("completes commands and arguments", () => {
    expect(completeCommand("whoa")).toBe("whoami ");
    expect(completeCommand("proj")).toBe("project");
    expect(completeCommand("project uganda-b")).toBe("project uganda-bookshop");
    expect(completeCommand("theme d")).toBe("theme dark");
    expect(completeCommand("xyz")).toBeNull();
  });

  it("links non-featured work to its row in the list", () => {
    expect(projectHref({ slug: "hms", featured: true })).toBe("/work/hms");
    expect(projectHref({ slug: "decade", featured: false })).toBe("/work#decade");
  });

  it("never mentions the private dashboard", () => {
    const all = ["help", "whoami", "projects all", "stack", "experience", "skills", "contact", "ls"]
      .map((c) => text(runCommand(c, ctx).lines))
      .join("\n");
    expect(all).not.toMatch(/jasper\s*os/i);
  });
});
