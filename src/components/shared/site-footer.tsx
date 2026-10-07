import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { profile } from "@/data/profile";
import { ShortcutsButton } from "@/components/shared/shortcuts-button";
import { crossHref } from "@/lib/links";
import type { Site } from "@/lib/sites";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const SOURCE_URL = "https://github.com/AshabaJasper/ashabajasper.dev";

/**
 * Shared footer for the portfolio and blog. The closing line doubles as the
 * last call to action on every page, so it always offers the plain email.
 */
export function SiteFooter({ site }: { site: Exclude<Site, "admin"> }) {
  const groups: { title: string; links: FooterLink[] }[] = [
    {
      title: "Site",
      links: [
        { label: "Home", href: crossHref(site, "portfolio", "/") },
        { label: "Work", href: crossHref(site, "portfolio", "/work") },
        { label: "CV", href: crossHref(site, "portfolio", "/cv") },
        { label: "About", href: crossHref(site, "portfolio", "/about") },
        { label: "Now", href: crossHref(site, "portfolio", "/now") },
        { label: "Contact", href: crossHref(site, "portfolio", "/contact") },
      ],
    },
    {
      title: "Writing",
      links: [
        { label: "All posts", href: crossHref(site, "blog", "/") },
        { label: "Topics", href: crossHref(site, "blog", "/tags") },
        { label: "RSS feed", href: crossHref(site, "blog", "/feed.xml") },
      ],
    },
    {
      title: "Elsewhere",
      links: [
        { label: "GitHub", href: profile.links.github, external: true },
        { label: "LinkedIn", href: profile.links.linkedin, external: true },
        { label: "X", href: profile.links.x, external: true },
        { label: "Google Developers", href: profile.links.googleDevelopers, external: true },
      ],
    },
  ];

  const year = new Date().getFullYear();

  return (
    <footer className="border-rule relative mt-28 overflow-hidden border-t">
      <div className="container-page py-16 sm:py-24">
        <div className="grid gap-14 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <p className="kicker kicker-prompt">say hello</p>
            <p className="font-display mt-5 max-w-[14ch] text-[clamp(2.5rem,6.5vw,4.75rem)] leading-[0.95]">
              Have a system worth building?
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="group text-foreground mt-8 inline-flex min-h-11 items-center gap-2 font-mono text-[clamp(1rem,2.4vw,1.25rem)] break-all"
            >
              <span className="decoration-primary underline decoration-2 underline-offset-[6px] transition-colors group-hover:text-primary">
                {profile.email}
              </span>
              <ArrowUpRight aria-hidden className="text-primary size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.75} />
            </a>
            <p className="text-muted-foreground mt-2 text-sm">{profile.location}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h2 className="kicker">{group.title}</h2>
                <ul className="mt-4 space-y-0.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          rel="me noopener"
                          target="_blank"
                          className="text-ink-soft hover:text-foreground inline-flex min-h-9 items-center text-[0.93rem] transition-colors"
                        >
                          {link.label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-ink-soft hover:text-foreground inline-flex min-h-9 items-center text-[0.93rem] transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-rule text-muted-foreground mt-16 flex flex-col gap-4 border-t pt-6 text-sm lg:flex-row lg:items-center lg:justify-between">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              &copy; {year} {profile.fullName}. Designed and built by {profile.name}.
            </span>
            <a href={SOURCE_URL} target="_blank" rel="noopener" className="hover:text-foreground inline-flex min-h-9 items-center gap-1 font-mono text-[0.78rem]">
              View source
              <ArrowUpRight aria-hidden className="size-3.5" strokeWidth={1.75} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </p>
          <p className="flex flex-wrap items-center gap-x-5">
            <ShortcutsButton />
            <Link href={crossHref(site, "portfolio", "/privacy")} className="hover:text-foreground inline-flex min-h-9 items-center">
              Privacy
            </Link>
            <Link href={crossHref(site, "portfolio", "/terms")} className="hover:text-foreground inline-flex min-h-9 items-center">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
