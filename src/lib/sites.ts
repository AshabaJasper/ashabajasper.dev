/**
 * One Next.js app serves three hosts. Every request is mapped to a site by its
 * Host header and rewritten to that site's internal folder under src/app.
 *
 * Pure and edge safe: no node imports, so the middleware and tests can use it.
 * Origins are built from ROOT_DOMAIN, never from request headers, so pages can
 * stay static and every absolute URL in metadata, sitemaps and feeds is stable.
 */

export const SITES = ["portfolio", "blog", "admin"] as const;
export type Site = (typeof SITES)[number];

/** The folder under src/app that renders each site. */
export const SITE_PREFIX: Record<Site, string> = {
  portfolio: "/portfolio",
  blog: "/blog",
  admin: "/admin",
};

/** The subdomain in front of the root domain; the portfolio is the apex. */
const SUBDOMAIN: Record<Site, string | null> = {
  portfolio: null,
  blog: "blog",
  admin: "admin",
};

export const DEFAULT_ROOT_DOMAIN = "ashabajasper.dev";

/** The configured root domain, with any port kept (for local development). */
export function rootDomain(): string {
  const raw = (process.env.ROOT_DOMAIN ?? "").trim().toLowerCase();
  return raw || DEFAULT_ROOT_DOMAIN;
}

/** Lower-cased host without a port or trailing dot. */
export function normalizeHost(host: string | null | undefined): string {
  return (host ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "127.0.0.1";
}

export interface ResolvedSite {
  site: Site;
  /** www.<root> answers with a permanent redirect to the apex. */
  redirectToApex: boolean;
}

/**
 * Which site a Host header belongs to. Unknown hosts (the container health
 * check on 127.0.0.1, a bare IP) fall back to the portfolio.
 */
export function resolveSite(host: string | null | undefined, root: string = rootDomain()): ResolvedSite {
  const h = normalizeHost(host);
  const r = normalizeHost(root);
  if (h === `www.${r}`) return { site: "portfolio", redirectToApex: true };
  if (h === `blog.${r}`) return { site: "blog", redirectToApex: false };
  if (h === `admin.${r}`) return { site: "admin", redirectToApex: false };
  return { site: "portfolio", redirectToApex: false };
}

/** The public origin of a site, for example https://blog.ashabajasper.dev. */
export function siteOrigin(site: Site, root: string = rootDomain()): string {
  const cleanRoot = root.trim().toLowerCase().replace(/\/+$/, "");
  const protocol = isLocalHost(normalizeHost(cleanRoot)) ? "http" : "https";
  const sub = SUBDOMAIN[site];
  return `${protocol}://${sub ? `${sub}.` : ""}${cleanRoot}`;
}

/** An absolute URL on a site. `path` is a public path such as "/work/hms". */
export function siteUrl(site: Site, path: string = "/", root: string = rootDomain()): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin(site, root)}${clean}`;
}

/** The internal path a public path is rewritten to. */
export function internalPath(site: Site, pathname: string): string {
  const clean = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_PREFIX[site]}${clean === "/" ? "" : clean}`;
}

/** API routes live outside the site folders; each one answers on its own hosts only. */
const API_HOSTS: ReadonlyArray<readonly [string, readonly Site[]]> = [
  ["/api/auth", ["admin"]],
  ["/api/contact", ["portfolio"]],
  ["/api/comments", ["blog"]],
  ["/api/form-token", ["portfolio", "blog"]],
  ["/api/health", ["portfolio", "blog", "admin"]],
];

/** Whether an /api path may be served on this site. Unknown API paths never are. */
export function apiAllowedOn(pathname: string, site: Site): boolean {
  const entry = API_HOSTS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return entry ? entry[1].includes(site) : false;
}
