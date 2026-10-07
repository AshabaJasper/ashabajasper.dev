import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, MessageSquare, RefreshCw, Tag } from "lucide-react";
import { profile } from "@/data/profile";
import { getAllPosts, getPost } from "@/lib/content/posts";
import { renderPostBody } from "@/lib/content/mdx";
import { extractToc } from "@/lib/content/toc";
import { postUrl } from "@/lib/content/feed";
import { siteUrl } from "@/lib/sites";
import { blogMetadata } from "@/components/blog/metadata";
import { formatDate, formatReadingTime, postKicker } from "@/components/blog/format";
import { TocDisclosure, TocRail } from "@/components/blog/toc";
import { AuthorCard, PostPager, SeriesNav, TagLinks } from "@/components/blog/post-parts";
import { CommentsSection } from "@/components/blog/comments-section";
import { PERSON_ID } from "@/lib/structured-data";

/**
 * A post. Rendered on first request and cached for five minutes, so the
 * build never needs the database (comments are read at render, and a
 * database outage only hides them). No generateStaticParams on purpose.
 */
export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found", description: "This post does not exist.", robots: { index: false } };
  return blogMetadata({
    path: `/${post.slug}`,
    title: post.title,
    description: post.description,
    type: "article",
    publishedTime: post.date,
    modifiedTime: post.updated ?? post.date,
    tags: post.tags,
    image: siteUrl("blog", `/og/${post.slug}`),
    imageAlt: `${post.ogTitle ?? post.title}, by ${profile.name}`,
  });
}

function jsonLd(post: NonNullable<Awaited<ReturnType<typeof getPost>>>): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    url: postUrl(post.slug),
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl(post.slug) },
    image: siteUrl("blog", `/og/${post.slug}`),
    keywords: post.tags.join(", "),
    inLanguage: "en-GB",
    author: { "@type": "Person", "@id": PERSON_ID, name: profile.fullName, url: siteUrl("portfolio", "/"), sameAs: Object.values(profile.links) },
    publisher: { "@type": "Person", "@id": PERSON_ID, name: profile.fullName, url: siteUrl("portfolio", "/") },
    ...(post.series ? { isPartOf: { "@type": "CreativeWorkSeries", name: post.series.name } } : {}),
  };
  // Escape "<" so a title can never close the script element.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [content, all] = await Promise.all([renderPostBody(post.body), getAllPosts()]);
  const toc = extractToc(post.body);

  const series = post.series;
  const parts = series
    ? all
        .filter((p) => p.series?.name === series.name)
        .sort((a, b) => (a.series?.part ?? 0) - (b.series?.part ?? 0))
    : [];
  // Inside a series, previous and next follow the parts; otherwise the date order.
  const sequence = parts.length > 1 ? parts : [...all].reverse();
  const index = sequence.findIndex((p) => p.slug === post.slug);
  const older = index > 0 ? sequence[index - 1] : null;
  const newer = index >= 0 && index < sequence.length - 1 ? sequence[index + 1] : null;

  return (
    <article className="container-page pt-10 pb-8 sm:pt-14" id="top">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(post) }} />

      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[0.92rem] transition-colors"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />
        All posts
      </Link>

      <div className="post-grid mt-8 sm:mt-12">
        <header className="post-header">
          <p className="kicker inline-flex items-center gap-2">
            <Tag aria-hidden className="size-3.5" strokeWidth={1.75} />
            {postKicker(post)}
          </p>
          <h1 className="mt-4 max-w-[17em] font-display text-[2.6rem] leading-[1.02] tracking-[-0.02em] [text-wrap:balance] sm:text-[3.6rem] lg:text-[4rem]">
            {post.title}
          </h1>
          <p className="text-ink-soft mt-6 max-w-[66ch] text-[1.2rem] leading-relaxed sm:text-[1.3rem]">
            {post.description}
          </p>
          <p className="post-meta text-muted-foreground border-rule mt-8 border-t pt-4 font-mono text-[0.8rem] tabular-nums">
            <span className="meta-item">
              <CalendarDays aria-hidden strokeWidth={1.75} />
              <span className="sr-only">Published </span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </span>
            {post.updated && post.updated !== post.date ? (
              <span className="meta-item">
                <RefreshCw aria-hidden strokeWidth={1.75} />
                Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
              </span>
            ) : null}
            <span className="meta-item">
              <Clock3 aria-hidden strokeWidth={1.75} />
              {formatReadingTime(post.readingMinutes)}
            </span>
            <a href="#comments" className="meta-item hover:text-foreground min-h-11 transition-colors">
              <MessageSquare aria-hidden strokeWidth={1.75} />
              Comments
            </a>
          </p>
        </header>

        <div className="post-rail">
          <TocRail items={toc} />
        </div>

        <div className="post-main">
          <div className="lg:hidden">
            <TocDisclosure items={toc} />
          </div>

          <div className="prose prose-blog">{content}</div>

          <footer className="mt-16 space-y-10">
            {series ? <SeriesNav name={series.name} parts={parts} currentSlug={post.slug} /> : null}
            <TagLinks tags={post.tags} />
            <AuthorCard />
            <PostPager older={older} newer={newer} />
          </footer>

          <CommentsSection slug={post.slug} />
        </div>
      </div>
    </article>
  );
}
