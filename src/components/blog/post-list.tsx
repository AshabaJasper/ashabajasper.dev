import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Hash, Layers } from "lucide-react";
import type { PostSummary } from "@/lib/content/parse";
import { formatDate, formatReadingTime, formatShortDate, tagLabel } from "@/components/blog/format";

/**
 * Post rows. The whole row is one link: the title link stretches over the
 * row, so there is a single tab stop and a single accessible name per post.
 * Title and description share one measure, so a description never stops
 * short of the title above it.
 */

export function PostRow({ post, headingLevel = 3, shortDate = false }: { post: PostSummary; headingLevel?: 2 | 3; shortDate?: boolean }) {
  const Title = headingLevel === 2 ? "h2" : "h3";
  return (
    <li className="post-row group relative">
      <p className="post-row-date meta-item">
        <CalendarDays aria-hidden strokeWidth={1.75} />
        <time dateTime={post.date}>{shortDate ? formatShortDate(post.date) : formatDate(post.date)}</time>
      </p>
      <div className="flex min-w-0 gap-6">
        <div className="min-w-0 max-w-[48rem] flex-1">
          <Title className="font-display text-[1.6rem] leading-[1.15] tracking-[-0.01em] sm:text-[1.85rem]">
            <Link
              href={`/${post.slug}`}
              className="decoration-link/60 underline-offset-[5px] group-hover:underline after:absolute after:inset-0 after:content-['']"
            >
              {post.title}
            </Link>
          </Title>
          <p className="text-ink-soft mt-2.5 text-[1rem] leading-relaxed">{post.description}</p>
          <p className="text-muted-foreground mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[0.76rem] leading-relaxed tabular-nums">
            <span className="meta-item">
              <Clock3 aria-hidden strokeWidth={1.75} />
              {formatReadingTime(post.readingMinutes)}
            </span>
            {post.series ? (
              <span className="meta-item">
                <Layers aria-hidden strokeWidth={1.75} />
                {post.series.name}, part {post.series.part}
              </span>
            ) : null}
            {post.tags.length > 0 ? (
              <span className="row-tags">
                <span className="sr-only">Topics: </span>
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="row-tag">
                    <Hash aria-hidden className="size-3 opacity-60" strokeWidth={1.75} />
                    {tagLabel(tag)}
                  </span>
                ))}
              </span>
            ) : null}
          </p>
        </div>
        <span className="row-arrow" aria-hidden>
          <ArrowRight className="size-4" strokeWidth={1.75} />
        </span>
      </div>
    </li>
  );
}

/** Posts grouped under year headings, newest year first. */
export function PostsByYear({ posts }: { posts: PostSummary[] }) {
  const years = new Map<string, PostSummary[]>();
  for (const post of posts) {
    const year = post.date.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), post]);
  }
  return (
    <div className="space-y-14">
      {[...years.entries()].map(([year, list]) => (
        <section key={year} aria-labelledby={`year-${year}`} className="post-year">
          <h2 id={`year-${year}`} className="post-year-heading">
            {year}
          </h2>
          <ol className="divide-rule border-rule divide-y border-t">
            {list.map((post) => (
              <PostRow key={post.slug} post={post} shortDate />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
