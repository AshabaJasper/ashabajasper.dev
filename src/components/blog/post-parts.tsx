import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { profile } from "@/data/profile";
import type { PostSummary } from "@/lib/content/parse";
import { tagPath } from "@/lib/content/feed";
import { crossHref } from "@/lib/links";
import { tagLabel } from "@/components/blog/format";
import { cn } from "@/lib/utils";

/** Every part of the series this post belongs to, in order, with the current one marked. */
export function SeriesNav({ name, parts, currentSlug }: { name: string; parts: PostSummary[]; currentSlug: string }) {
  if (parts.length < 2) return null;
  return (
    <nav aria-labelledby="series-heading" className="series-box">
      <p className="kicker">Series</p>
      <h2 id="series-heading" className="mt-2 font-serif text-[1.55rem] leading-tight">
        {name}
      </h2>
      <ol className="mt-4 space-y-1">
        {parts.map((part) => {
          const current = part.slug === currentSlug;
          return (
            <li key={part.slug} className="flex gap-3">
              <span className="text-muted-foreground w-6 shrink-0 pt-[0.6rem] font-mono text-[0.78rem] tabular-nums">
                {String(part.series?.part ?? "").padStart(2, "0")}
              </span>
              {current ? (
                <span aria-current="page" className="text-foreground inline-flex min-h-11 items-center font-medium">
                  {part.title}
                  <span className="text-muted-foreground ml-2 font-mono text-[0.72rem] font-normal tracking-[0.1em] uppercase">
                    You are here
                  </span>
                </span>
              ) : (
                <Link href={`/${part.slug}`} className="link inline-flex min-h-11 items-center">
                  {part.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function TagLinks({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <h2 className="kicker mr-2">Filed under</h2>
      <ul className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <li key={tag}>
            <Link href={tagPath(tag)} className="tag-chip">
              {tagLabel(tag)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Older and newer neighbours in the full post list. */
export function PostPager({ older, newer }: { older: PostSummary | null; newer: PostSummary | null }) {
  if (!older && !newer) return null;
  return (
    <nav aria-label="More posts" className="grid gap-4 sm:grid-cols-2">
      {older ? (
        <Link href={`/${older.slug}`} className="pager-card">
          <span className="kicker inline-flex items-center gap-1.5">
            <ArrowLeft aria-hidden className="size-3.5" strokeWidth={1.75} />
            Previous
          </span>
          <span className="mt-2 block font-serif text-[1.35rem] leading-snug">{older.title}</span>
        </Link>
      ) : (
        <span aria-hidden className="hidden sm:block" />
      )}
      {newer ? (
        <Link href={`/${newer.slug}`} className={cn("pager-card sm:text-right")}>
          <span className="kicker inline-flex items-center gap-1.5 sm:justify-end">
            Next
            <ArrowRight aria-hidden className="size-3.5" strokeWidth={1.75} />
          </span>
          <span className="mt-2 block font-serif text-[1.35rem] leading-snug">{newer.title}</span>
        </Link>
      ) : null}
    </nav>
  );
}

export function AuthorCard() {
  return (
    <aside aria-label="About the author" className="author-card">
      <Image
        src={profile.avatar.src}
        width={72}
        height={72}
        alt={profile.avatar.alt}
        className="border-rule size-[72px] shrink-0 rounded-full border object-cover"
      />
      <div>
        <p className="kicker">Written by</p>
        <p className="mt-1 font-serif text-[1.5rem] leading-tight">{profile.name}</p>
        <p className="text-ink-soft mt-2 max-w-[56ch] text-[0.98rem] leading-relaxed">{profile.heroLine}</p>
        <Link href={crossHref("blog", "portfolio", "/about")} className="link mt-2 inline-flex min-h-11 items-center text-[0.95rem]">
          More about me
        </Link>
      </div>
    </aside>
  );
}
