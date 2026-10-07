import type { Metadata } from "next";
import Link from "next/link";
import { crossHref } from "@/lib/links";

export const metadata: Metadata = {
  title: "Post not found",
  description: "This address does not lead to a post on Ashaba Jasper's blog.",
  robots: { index: false, follow: true },
};

/** The blog's 404: served with status 404 by notFound() and the catch-all route. */
export default function BlogNotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col justify-center py-20">
      <p className="kicker">Error 404</p>
      <h1 className="mt-4 max-w-[16ch] font-serif text-[3rem] leading-[0.98] tracking-[-0.02em] sm:text-[4.4rem]">
        That post is not here.
      </h1>
      <p className="text-ink-soft mt-6 max-w-[48ch] text-[1.12rem] leading-relaxed">
        It may have moved, never existed, or the address has a typo. Everything that is published is listed on the
        writing page.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-full px-6 text-[0.95rem] font-medium"
        >
          See all posts
        </Link>
        <Link
          href={crossHref("blog", "portfolio", "/")}
          className="border-rule hover:bg-muted inline-flex min-h-11 items-center rounded-full border px-6 text-[0.95rem] transition-colors"
        >
          Go to the portfolio
        </Link>
      </div>
    </div>
  );
}
