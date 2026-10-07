import type { Metadata } from "next";
import Link from "next/link";
import { Rss } from "lucide-react";
import { getAllPosts } from "@/lib/content/posts";
import type { PostSummary } from "@/lib/content/parse";
import { blogMetadata } from "@/components/blog/metadata";
import { PostsByYear } from "@/components/blog/post-list";

// A layout title template does not apply to a page in the same segment, so the full title is set here.
export const metadata: Metadata = blogMetadata({
  path: "/",
  title: "Writing · Ashaba Jasper",
  absoluteTitle: true,
  description:
    "Essays and build notes by Ashaba Jasper on data, AI and business systems in East Africa, including the Building Jasper OS series.",
});

/** What each series is about, shown in its callout. Only series with real posts appear. */
const SERIES_BLURB: Record<string, string> = {
  "Building Jasper OS":
    "Jasper OS is the private life dashboard I build and run for myself. This series walks through the decisions behind it, one part at a time.",
};

function seriesGroups(posts: PostSummary[]): { name: string; parts: PostSummary[] }[] {
  const groups = new Map<string, PostSummary[]>();
  for (const post of posts) {
    if (!post.series) continue;
    groups.set(post.series.name, [...(groups.get(post.series.name) ?? []), post]);
  }
  return [...groups.entries()].map(([name, parts]) => ({
    name,
    parts: parts.sort((a, b) => (a.series?.part ?? 0) - (b.series?.part ?? 0)),
  }));
}

function seriesId(name: string): string {
  return `series-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  const series = seriesGroups(posts);

  return (
    <div className="container-page pt-14 pb-8 sm:pt-20">
      <header className="max-w-[46rem]">
        <p className="kicker reveal">Writing</p>
        <h1
          className="reveal mt-4 font-serif text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-[4.4rem]"
          style={{ ["--reveal-delay" as string]: "60ms" }}
        >
          Notes from building <em className="italic">real</em> systems.
        </h1>
        <p
          className="reveal text-ink-soft mt-6 max-w-[58ch] text-[1.12rem] leading-relaxed sm:text-[1.2rem]"
          style={{ ["--reveal-delay" as string]: "120ms" }}
        >
          I write about the data, AI and business systems I design and ship in East Africa: the architecture, the
          trade-offs, and the small decisions that keep software honest once people depend on it.
        </p>
        <p className="reveal mt-6 flex flex-wrap gap-x-6 gap-y-2" style={{ ["--reveal-delay" as string]: "180ms" }}>
          <a href="/feed.xml" className="link inline-flex min-h-11 items-center gap-2 text-[0.95rem]">
            <Rss aria-hidden className="size-4" strokeWidth={1.75} />
            Subscribe by RSS
          </a>
          <Link href="/tags" className="link inline-flex min-h-11 items-center text-[0.95rem]">
            Browse by topic
          </Link>
        </p>
      </header>

      {series.map((group) => (
        <section key={group.name} aria-labelledby={seriesId(group.name)} className="series-callout mt-16 sm:mt-20">
          <div>
            <p className="kicker">A series in {group.parts.length} parts</p>
            <h2 id={seriesId(group.name)} className="mt-3 font-serif text-[2rem] leading-tight tracking-[-0.01em] sm:text-[2.4rem]">
              {group.name}
            </h2>
            {SERIES_BLURB[group.name] ? (
              <p className="text-ink-soft mt-3 max-w-[48ch] leading-relaxed">{SERIES_BLURB[group.name]}</p>
            ) : null}
          </div>
          <ol className="series-callout-list">
            {group.parts.map((part) => (
              <li key={part.slug}>
                <Link href={`/${part.slug}`} className="series-callout-link group">
                  <span className="text-muted-foreground font-mono text-[0.78rem] tabular-nums">
                    {String(part.series?.part ?? "").padStart(2, "0")}
                  </span>
                  <span className="font-serif text-[1.3rem] leading-snug group-hover:underline group-hover:decoration-link/60 group-hover:underline-offset-4">
                    {part.title}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section aria-label="All posts" className="mt-16 sm:mt-24">
        <p className="kicker">All posts</p>
        <div className="mt-6">
          {posts.length > 0 ? (
            <PostsByYear posts={posts} />
          ) : (
            <p className="text-muted-foreground border-rule border-t pt-8">
              Nothing is published yet. The first posts are being written now; the RSS feed will tell you when they land.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
