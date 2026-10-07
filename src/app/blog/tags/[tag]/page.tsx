import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllPosts, getAllTags } from "@/lib/content/posts";
import { tagPath } from "@/lib/content/feed";
import { blogMetadata } from "@/components/blog/metadata";
import { tagLabel } from "@/components/blog/format";
import { PostRow } from "@/components/blog/post-list";

type Params = { params: Promise<{ tag: string }> };

/** Tags come from the post files only, so every tag page can be built ahead of time. */
export async function generateStaticParams() {
  return (await getAllTags()).map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { tag } = await params;
  const known = (await getAllTags()).find((entry) => entry.tag === decodeURIComponent(tag));
  if (!known) return { title: "Topic not found", description: "There are no posts under this topic.", robots: { index: false } };
  const label = tagLabel(known.tag);
  return blogMetadata({
    path: tagPath(known.tag),
    title: `Posts about ${label}`,
    description: `${known.count} ${known.count === 1 ? "post" : "posts"} by Ashaba Jasper about ${label}, newest first.`,
  });
}

export default async function TagPage({ params }: Params) {
  const { tag: raw } = await params;
  const tag = decodeURIComponent(raw);
  const posts = (await getAllPosts()).filter((post) => post.tags.includes(tag));
  if (posts.length === 0) notFound();

  return (
    <div className="container-page pt-10 pb-8 sm:pt-14">
      <Link
        href="/tags"
        className="text-muted-foreground hover:text-foreground -ml-1 inline-flex min-h-11 items-center gap-1.5 px-1 text-[0.92rem] transition-colors"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />
        All topics
      </Link>
      <header className="mt-8 max-w-[46rem] sm:mt-12">
        <p className="kicker">Topic</p>
        <h1 className="mt-4 font-display text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-[4rem]">{tagLabel(tag)}</h1>
        <p className="text-muted-foreground mt-4 font-mono text-[0.85rem] tabular-nums">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </header>
      <ol className="divide-rule border-rule mt-12 divide-y border-t">
        {posts.map((post) => (
          <PostRow key={post.slug} post={post} headingLevel={2} />
        ))}
      </ol>
    </div>
  );
}
