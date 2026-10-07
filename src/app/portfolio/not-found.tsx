import type { Metadata } from "next";
import Link from "next/link";
import { NOT_FOUND_METADATA } from "@/components/portfolio/not-found-metadata";
import { buttonPrimary } from "@/components/portfolio/ui";
import { crossHref } from "@/lib/links";

export const metadata: Metadata = NOT_FOUND_METADATA;

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Work", href: "/work" },
  { label: "Writing", href: crossHref("portfolio", "blog", "/") },
  { label: "Contact", href: "/contact" },
];

export default function PortfolioNotFound() {
  return (
    <section aria-labelledby="nf-title" className="container-page flex min-h-[65vh] flex-col justify-center py-20 sm:py-28">
      <p className="kicker">Error 404</p>
      <h1 id="nf-title" className="mt-4 font-serif text-[3.25rem] leading-[0.95] tracking-[-0.02em] sm:text-[6rem]">
        Nothing lives here.
      </h1>
      <p className="text-ink-soft mt-6 max-w-[46ch] text-[1.06rem] leading-relaxed sm:text-lg">
        The page may have moved, or the address has a typo. One of these will get you somewhere useful.
      </p>
      <Link href="/" className={`${buttonPrimary} mt-9 w-fit`}>
        Go to the home page
      </Link>
      <nav aria-label="Popular pages" className="mt-10">
        <ul className="flex flex-wrap gap-x-7 gap-y-1">
          {LINKS.map((link) => (
            <li key={link.label}>
              <Link href={link.href} className="link inline-flex min-h-11 items-center text-[1.02rem]">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
