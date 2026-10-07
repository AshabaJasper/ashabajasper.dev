import type { Metadata } from "next";
import Link from "next/link";
import { buttonPrimary, buttonSecondary } from "@/components/portfolio/ui";
import { profile } from "@/data/profile";
import { crossHref } from "@/lib/links";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    site: "portfolio",
    path: "/contact/thanks",
    title: "Message sent",
    description: "Your message to Ashaba Jasper has arrived. Here is what happens next, and where to go from here.",
  }),
  robots: { index: false, follow: true },
};

/** Reached after a successful send. Visiting it directly is harmless: it carries no data. */
export default function ContactThanksPage() {
  return (
    <section aria-labelledby="thanks-title" className="container-page flex min-h-[60vh] flex-col justify-center py-20 sm:py-28">
      <p className="kicker">Message sent</p>
      <h1 id="thanks-title" className="mt-4 max-w-[16ch] font-serif text-[2.75rem] leading-[1] tracking-[-0.02em] sm:text-[4.25rem]">
        Thank you. Your message is with me.
      </h1>
      <div className="text-ink-soft mt-6 max-w-[56ch] space-y-4 text-[1.06rem] leading-relaxed sm:text-lg">
        <p>I read every message and reply personally, from my own email address.</p>
        <p>
          If something is urgent or you forgot a detail, write to{" "}
          <a href={`mailto:${profile.email}`} className="link">
            {profile.email}
          </a>
          .
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/work" className={buttonPrimary}>
          Look through the work
        </Link>
        <a href={crossHref("portfolio", "blog", "/")} className={buttonSecondary}>
          Read the writing
        </a>
      </div>
    </section>
  );
}
