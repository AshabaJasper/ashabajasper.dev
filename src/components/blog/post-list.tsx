import Link from "next/link";
import type { PostSummary } from "@/lib/content/parse";
import { formatDate, formatReadingTime, formatShortDate } from "@/components/blog/format";

/**
 * Post rows. The whole row is one link: the title link stretches over the
 * row, so there is a single tab stop and a single accessible name per post.
 * The meta line stays short (reading time and series part); topics live on
 * the post and the topic pages.
 */

export function PostRow({ post, headingLevel = 3, shortDate = false }: { post: PostSummary; headingLevel?: 2 | 3; shortDate?: boolean }) {
  const Title = headingLevel === 2 ? "h2" : "h3";
  return (
    <li className="post-row group relative">
      <time dateTime={post.date} className="post-row-date">
        {shortDate ? formatShortDate(post.date) : formatDate(post.date)}
      </time>
      <div className="min-w-0">
        <Title className="font-display text-[1.65rem] leading-[1.15] tracking-[-0.01em] sm:text-[1.85rem]">
          <Link
            href={`/${post.slug}`}
            className="decoration-link/60 underline-offset-[5px] group-hover:underline after:absolute after:inset-0 after:content-['']"
          >
            {post.title}
          </Link>
        </Title>
        <p className="text-ink-soft mt-2 max-w-[62ch] text-[1rem] leading-relaxed">{post.description}</p>
        <p className="text-muted-foreground mt-3 font-mono text-[0.78rem] leading-relaxed tabular-nums">
          {[formatReadingTime(post.readingMinutes), post.series ? `${post.series.name}, part ${post.series.part}` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
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
