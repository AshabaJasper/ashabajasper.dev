import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { apiAllowedOn, internalPath, resolveSite, siteOrigin } from "@/lib/sites";

/** Admin pages a signed-out visitor may open. */
const ADMIN_PUBLIC = new Set(["/login", "/setup", "/robots.txt"]);

/**
 * Whether the request carries a live admin session. Reads the Auth.js JWT
 * directly instead of wrapping the middleware in Auth.js: the wrapper swaps
 * the request origin for AUTH_URL (which turns rewrites into proxies) and
 * sets CSRF cookies on every host, and the public hosts must set none.
 * The admin layout checks the session again with the full config.
 */
async function hasAdminSession(req: NextRequest): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  const secureCookie = siteOrigin("admin").startsWith("https:");
  const cookieName = `${secureCookie ? "__Secure-" : ""}authjs.session-token`;
  try {
    const token = await getToken({ req, secret, secureCookie, cookieName, salt: cookieName });
    if (!token?.id) return false;
    const expiry = (token as { sessionExpiry?: unknown }).sessionExpiry;
    return typeof expiry !== "number" || Date.now() <= expiry;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const { site, redirectToApex } = resolveSite(req.headers.get("host"));

  if (redirectToApex) {
    return NextResponse.redirect(`${siteOrigin("portfolio")}${url.pathname}${url.search}`, 308);
  }

  if (url.pathname.startsWith("/api/")) {
    return apiAllowedOn(url.pathname, site) ? NextResponse.next() : new NextResponse(null, { status: 404 });
  }

  if (site === "admin") {
    const signedIn = await hasAdminSession(req);
    if (!signedIn && !ADMIN_PUBLIC.has(url.pathname)) {
      return NextResponse.redirect(`${siteOrigin("admin")}/login`);
    }
    // The login page checks the database-bound session before redirecting.
    // A valid-looking JWT may have been revoked by a password change.
  }

  // Clone the incoming URL so the rewrite stays on this server (same origin).
  const target = url.clone();
  target.pathname = internalPath(site, url.pathname);
  // Keep the visitor's host through the internal rewrite. Server Actions
  // compare Origin against x-forwarded-host, not the container's loopback host.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-forwarded-host", req.headers.get("host") ?? url.host);
  const response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  if (site === "admin") response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Static files keep their URL on every host. .txt and .xml are not excluded
  // on purpose: robots.txt, sitemap.xml and feed.xml are per-site routes.
  matcher: [
    "/((?!_next/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2|ttf|otf|css|js|map|webmanifest|pdf)$).*)",
  ],
};
