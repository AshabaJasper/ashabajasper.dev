import { SITE_PREFIX, siteUrl, type Site } from "@/lib/sites";

/**
 * A link from one site to a path on another. Same host stays relative so
 * client navigation works; another host becomes an absolute URL.
 */
export function crossHref(current: Site, target: Site, path: string = "/"): string {
  return current === target ? path : siteUrl(target, path);
}

/**
 * The public path for a pathname that may still carry the internal site
 * folder (server renders after a middleware rewrite can report it).
 */
export function publicPath(pathname: string): string {
  for (const prefix of Object.values(SITE_PREFIX)) {
    if (pathname === prefix) return "/";
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }
  return pathname || "/";
}

export interface NavItem {
  label: string;
  site: Site;
  path: string;
}

/** The primary navigation shared by the portfolio and blog headers. */
export const PRIMARY_NAV: readonly NavItem[] = [
  { label: "Work", site: "portfolio", path: "/work" },
  { label: "Writing", site: "blog", path: "/" },
  { label: "About", site: "portfolio", path: "/about" },
  { label: "Contact", site: "portfolio", path: "/contact" },
];
