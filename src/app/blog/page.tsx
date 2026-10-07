import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenText, CalendarDays, Clock3, Hash, Rss, Tags } from "lucide-react";
import { getAllPosts, getPost } from "@/lib/content/posts";
import { extractToc } from "@/lib/content/toc";
import type { PostSummary } from "@/lib/content/parse";
import { blogMetadata } from "@/components/blog/metadata";
import { PostsByYear } from "@/components/blog/post-list";
import { formatDate, formatReadingTime, tagLabel } from "@/components/blog/format";

// A layout title template does not apply to a page in the same segment, so the full title is set here.
export const metadata: Metadata = blogMetadata({
  path: "/",
  title: "Writing · Ashaba Jasper",
  absoluteTitle: true,
  description:
    "Essays and build notes by Ashaba Jasper on data, AI and business systems in East Africa.",
});

/** What each series is about, shown in its callout. Only series with real posts appear. */
const SERIES_BLURB: Record<string, string> = {
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
  const [featured, ...rest] = posts;
  const featuredPost = featured ? await getPost(featured.slug) : null;
  const inside = featuredPost ? extractToc(featuredPost.body).filter((item) => item.depth === 2).slice(0, 6) : [];
  // Counted from the post files, never typed in.
  const facts = [
    { label: "Posts", value: posts.length, icon: BookOpenText },
    { label: "Minutes to read", value: posts.reduce((sum, post) => sum + post.readingMinutes, 0), icon: Clock3 },
    { label: "Topics", value: new Set(posts.flatMap((post) => post.tags)).size, icon: Tags },
  ];

  return (
    <div className="container-page pt-14 pb-8 sm:pt-20">
      <header>
        <p className="kicker kicker-prompt reveal">Writing</p>
        <h1
          className="reveal mt-4 font-display text-[3rem] leading-[0.98] tracking-[-0.03em] sm:text-[4.4rem] lg:text-[5.4rem]"
          style={{ ["--reveal-delay" as string]: "60ms" }}
        >
          Notes from building <span className="text-primary">real</span> systems.
        </h1>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-20">
          <div>
            <p
              className="reveal text-ink-soft max-w-[64ch] text-[1.12rem] leading-relaxed sm:text-[1.2rem]"
              style={{ ["--reveal-delay" as string]: "120ms" }}
            >
              I write about the data, AI and business systems I design and ship in East Africa: the architecture, the
              trade-offs, and the small decisions that keep software honest once people depend on it.
            </p>
            <p className="reveal mt-5 flex flex-wrap gap-x-6 gap-y-2" style={{ ["--reveal-delay" as string]: "180ms" }}>
              <a href="/feed.xml" className="link inline-flex min-h-11 items-center gap-2 text-[0.95rem]">
                <Rss aria-hidden className="size-4" strokeWidth={1.75} />
                Subscribe by RSS
              </a>
              <Link href="/tags" className="link inline-flex min-h-11 items-center gap-2 text-[0.95rem]">
                <Tags aria-hidden className="size-4" strokeWidth={1.75} />
                Browse by topic
              </Link>
            </p>
          </div>
          {posts.length > 0 ? (
            <dl className="blog-facts reveal" style={{ ["--reveal-delay" as string]: "240ms" }}>
              {facts.map(({ label, value, icon: Icon }) => (
                <div key={label} className="blog-fact">
                  <dt>
                    <Icon aria-hidden className="size-3.5" strokeWidth={1.75} />
                    {label}
                  </dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </header>

      {featured ? (
        <section aria-labelledby="featured-heading" className="mt-14 sm:mt-20">
          <p id="featured-heading" className="kicker">
            Latest post
          </p>
          <article className="featured-post group mt-5">
            <div className="flex min-w-0 flex-col">
              <p className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[0.78rem] tabular-nums">
                <span className="meta-item">
                  <CalendarDays aria-hidden strokeWidth={1.75} />
                  <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                </span>
                <span className="meta-item">
                  <Clock3 aria-hidden strokeWidth={1.75} />
                  {formatReadingTime(featured.readingMinutes)}
                </span>
              </p>
              <h2 className="mt-4 font-display text-[1.8rem] leading-[1.06] tracking-[-0.025em] [text-wrap:balance] sm:text-[2.5rem] lg:text-[2.75rem]">
                <Link
                  href={`/${featured.slug}`}
                  className="decoration-link/60 underline-offset-[6px] group-hover:underline after:absolute after:inset-0 after:z-[1] after:content-['']"
                >
                  {featured.title}
                </Link>
              </h2>
              <p className="text-ink-soft mt-4 text-[1.08rem] leading-relaxed sm:text-[1.15rem]">{featured.description}</p>
              <p className="text-muted-foreground mt-5 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-[0.76rem]">
                <span className="sr-only">Topics: </span>
                {featured.tags.map((tag) => (
                  <span key={tag} className="row-tag">
                    <Hash aria-hidden className="size-3 opacity-60" strokeWidth={1.75} />
                    {tagLabel(tag)}
                  </span>
                ))}
              </p>
              <span className="read-more mt-auto pt-7" aria-hidden>
                Read the post
                <ArrowRight className="size-4" strokeWidth={1.75} />
              </span>
            </div>
            {inside.length > 0 ? (
              <div className="featured-inside hidden pt-6 md:block lg:pt-0">
                <p className="kicker">Inside</p>
                <ol className="mt-3">
                  {inside.map((item, i) => (
                    <li key={item.id}>
                      <span className="text-muted-foreground font-mono text-[0.74rem] tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </article>
        </section>
      ) : null}

      {series.map((group) => (
        <section key={group.name} aria-labelledby={seriesId(group.name)} className="series-callout mt-16 sm:mt-20">
          <div>
            <p className="kicker">A series in {group.parts.length} parts</p>
            <h2 id={seriesId(group.name)} className="mt-3 font-display text-[2rem] leading-tight tracking-[-0.01em] sm:text-[2.4rem]">
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
                  <span className="font-display text-[1.3rem] leading-snug group-hover:underline group-hover:decoration-link/60 group-hover:underline-offset-4">
                    {part.title}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {rest.length > 0 ? (
        <section aria-label="More posts" className="mt-16 sm:mt-24">
          <p className="kicker">More posts</p>
          <div className="mt-6">
            <PostsByYear posts={rest} />
          </div>
        </section>
      ) : null}

      {posts.length === 0 ? (
        <section aria-label="Posts" className="border-rule mt-16 border-t pt-8">
          <p className="text-ink-soft max-w-[60ch] text-[1.05rem] leading-relaxed">
            New writing lands here first.{" "}
            <a href="/feed.xml" className="link">
              Follow the RSS feed
            </a>{" "}
            to get each post as it is published.
          </p>
        </section>
      ) : null}
    </div>
  );
}
