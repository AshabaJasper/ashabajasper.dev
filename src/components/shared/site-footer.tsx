import Link from "next/link";
import { profile } from "@/data/profile";
import { crossHref } from "@/lib/links";
import type { Site } from "@/lib/sites";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

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
    <footer className="border-rule mt-24 border-t">
      <div className="container-page py-14 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="kicker">Say hello</p>
            <p className="mt-4 max-w-[18ch] font-serif text-[2.4rem] leading-[1.05] tracking-[-0.015em] sm:text-[3.2rem]">
              Have a system worth building?
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="text-link hover:text-link-hover mt-6 inline-flex min-h-11 items-center text-lg underline decoration-current/30 underline-offset-4 transition-colors hover:decoration-current"
            >
              {profile.email}
            </a>
            <p className="text-muted-foreground mt-2 text-sm">{profile.location}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {groups.map((group) => (
              <div key={group.title}>
                <h2 className="kicker">{group.title}</h2>
                <ul className="mt-4 space-y-1">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          rel="me noopener"
                          target="_blank"
                          className="text-ink-soft hover:text-foreground inline-flex min-h-9 items-center text-[0.95rem] transition-colors"
                        >
                          {link.label}
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-ink-soft hover:text-foreground inline-flex min-h-9 items-center text-[0.95rem] transition-colors"
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

        <div className="border-rule text-muted-foreground mt-14 flex flex-col gap-3 border-t pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {profile.fullName}. Built with Next.js, self-hosted on a Hostinger VPS.
          </p>
          <p className="flex gap-5">
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
