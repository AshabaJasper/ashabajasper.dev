import { getPost } from "@/lib/content/posts";
import { renderOgImage } from "@/lib/og";
import { rootDomain } from "@/lib/sites";
import { formatDate, formatReadingTime } from "@/components/blog/format";

export const runtime = "nodejs";

/** The social card for one post: series or "Writing", the short title, date and reading time. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

  return renderOgImage({
    kicker: post.series ? `${post.series.name}, part ${post.series.part}` : "Writing",
    title: post.ogTitle ?? post.title,
    meta: `${formatDate(post.date)} · ${formatReadingTime(post.readingMinutes)}`,
    host: `blog.${rootDomain().replace(/:\d+$/, "")}`,
  });
}
