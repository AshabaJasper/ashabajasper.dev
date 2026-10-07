import type { Metadata } from "next";
import Link from "next/link";
import { getAllTags } from "@/lib/content/posts";
import { tagPath } from "@/lib/content/feed";
import { blogMetadata } from "@/components/blog/metadata";
import { tagLabel } from "@/components/blog/format";

export const metadata: Metadata = blogMetadata({
  path: "/tags",
  title: "Topics",
  description: "Every topic Ashaba Jasper writes about, from architecture and data to self-hosting, with a count of posts for each.",
});

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="container-page pt-14 pb-8 sm:pt-20">
      <header className="max-w-[46rem]">
        <p className="kicker">Writing</p>
        <h1 className="mt-4 font-serif text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-[4rem]">Topics</h1>
        <p className="text-ink-soft mt-5 max-w-[56ch] text-[1.1rem] leading-relaxed">
          Every post is filed under a few topics. Pick one to read everything written about it.
        </p>
      </header>

      {tags.length > 0 ? (
        <ul className="mt-12 grid sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
          {tags.map(({ tag, count }) => (
            <li key={tag} className="border-rule border-t">
              <Link href={tagPath(tag)} className="group flex min-h-16 items-baseline justify-between gap-4 py-4 pr-4">
                <span className="font-serif text-[1.45rem] leading-tight group-hover:underline group-hover:decoration-link/60 group-hover:underline-offset-4">
                  {tagLabel(tag)}
                </span>
                <span className="text-muted-foreground font-mono text-[0.8rem] tabular-nums">
                  {count} {count === 1 ? "post" : "posts"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground mt-12">No topics yet. They appear here once posts are published.</p>
      )}
    </div>
  );
}
