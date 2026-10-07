import "server-only";
import { profile } from "@/data/profile";
import { awards, certifications, cvSummary, notableProjects, skillGroups } from "@/data/cv";
import { experience, experiencePeriod } from "@/data/experience";
import { featuredWork, work } from "@/data/work";
import { getAllPosts, getPost } from "@/lib/content/posts";
import { siteUrl } from "@/lib/sites";

/**
 * llms.txt (https://llmstxt.org): a plain Markdown guide that lets AI systems
 * answer questions about Ashaba accurately and cite the right pages. Built
 * from the same data the pages render, so it never drifts from the site.
 */

const p = (path: string) => siteUrl("portfolio", path);
const b = (path: string) => siteUrl("blog", path);

function identity(): string {
  return [
    `# ${profile.fullName}`,
    "",
    `> ${profile.fullName} (also written ${profile.name}) is a ${profile.headline.toLowerCase().replace(/, /g, ", ")} based in ${profile.location}. ${profile.heroLine}`,
    "",
    `- Current roles: ${profile.currently.map((c) => `${c.role}, ${c.name}`).join("; ")}`,
    `- Education: ${profile.education.degree}, GPA ${profile.education.gpa}, ${profile.education.school}`,
    `- Contact: ${profile.email}`,
    `- Profiles: GitHub ${profile.links.github}, LinkedIn ${profile.links.linkedin}, X ${profile.links.x}`,
  ].join("\n");
}

export async function buildLlmsTxt(): Promise<string> {
  const posts = await getAllPosts();
  return [
    identity(),
    "",
    "## Key pages",
    "",
    `- [Home](${p("/")}): who he is, selected work and writing`,
    `- [CV](${p("/cv")}): full dated experience, education, skills, awards and certifications`,
    `- [About](${p("/about")}): background and approach`,
    `- [Work](${p("/work")}): all ${work.length} projects`,
    `- [Contact](${p("/contact")}): how to reach him`,
    `- [Full profile for language models](${p("/llms-full.txt")}): everything above in one file`,
    "",
    "## Case studies",
    "",
    ...featuredWork().map((w) => `- [${w.name}](${p(`/work/${w.slug}`)}): ${w.summary}`),
    "",
    "## Writing",
    "",
    ...posts.map((post) => `- [${post.title}](${b(`/${post.slug}`)}): ${post.description}`),
    "",
  ].join("\n");
}

export async function buildLlmsFullTxt(): Promise<string> {
  const posts = await getAllPosts();
  const bodies = await Promise.all(posts.map((post) => getPost(post.slug)));
  const lines: string[] = [identity(), "", "## Summary", "", cvSummary, ""];

  lines.push("## Experience", "");
  for (const e of experience) {
    lines.push(`### ${e.role}, ${e.organisation} (${experiencePeriod(e)})`, "", e.description);
    for (const h of e.highlights) lines.push(`- ${h}`);
    lines.push("");
  }

  lines.push("## Notable projects", "");
  for (const project of notableProjects) lines.push(`- ${project.name} (${project.context}): ${project.text}`);
  lines.push("");

  lines.push("## Skills", "");
  for (const g of skillGroups) lines.push(`- ${g.label}: ${g.items.join(", ")}`);
  lines.push("");

  lines.push("## Awards", "");
  for (const a of awards) lines.push(`- ${a.title}, ${a.issuer} (${a.year})`);
  lines.push("", "## Certifications", "");
  for (const c of certifications) lines.push(`- ${c.title}, ${c.issuer} (${c.year})`);
  lines.push("");

  lines.push("## Case studies", "");
  for (const w of featuredWork()) {
    lines.push(`### ${w.name}`, "", `URL: ${p(`/work/${w.slug}`)}`, "", w.caseStudy.context, "");
    for (const item of w.caseStudy.built) lines.push(`- ${item}`);
    lines.push("", `Stack: ${w.caseStudy.stack.join(", ")}`, "");
  }

  lines.push(`## All projects (${work.length})`, "");
  for (const w of work) {
    const meta = [w.sector, w.year ? String(w.year) : null].filter(Boolean).join(", ");
    lines.push(`- ${w.name} (${meta})${w.url ? ` ${w.url}` : ""}: ${w.summary}`);
  }
  lines.push("");

  lines.push("## Blog posts", "");
  for (const post of bodies) {
    if (!post) continue;
    lines.push(`### ${post.title}`, "", `URL: ${b(`/${post.slug}`)}`, `Published: ${post.date}`, "", post.body.trim(), "");
  }
  return lines.join("\n");
}

export function textResponse(body: string, type = "text/markdown; charset=utf-8"): Response {
  return new Response(body, {
    headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600", "X-Robots-Tag": "noindex" },
  });
}
