# Architecture

## One app, three hosts

```
request  ->  src/middleware.ts  ->  resolveSite(Host)  ->  rewrite /<site><path>  ->  src/app/<site>/...
```

| Host | Site | Internal folder |
| --- | --- | --- |
| `ashabajasper.dev` (and unknown hosts, the health check) | portfolio | `src/app/portfolio` |
| `www.ashabajasper.dev` | 308 to the apex | none |
| `blog.ashabajasper.dev` | blog | `src/app/blog` |
| `admin.ashabajasper.dev` | admin | `src/app/admin` |

- Every request is rewritten, so a path that already carries a prefix on the wrong host
  (`ashabajasper.dev/blog/x`) becomes `/portfolio/blog/x` and lands on that site's
  `[...missing]` catch-all: a real 404 inside the right layout.
- `/api/*` is not rewritten. `apiAllowedOn()` decides which host may call which API;
  anything else is a 404.
- The middleware does not use the Auth.js wrapper. The wrapper replaces the request origin
  with `AUTH_URL`, which turns rewrites into proxies, and sets CSRF cookies on every host.
  The admin gate reads the session JWT with `getToken()`; the admin layout checks again
  with the full config.
- Origins come from `ROOT_DOMAIN` (`siteOrigin`, `siteUrl`), never from request headers,
  so pages stay static and every absolute URL is stable.
- No file-convention `robots.ts`, `sitemap.ts` or `opengraph-image.tsx`: they would emit
  prefixed URLs. Each site has route handlers for `robots.txt`, `sitemap.xml` and `og`.

## Data

- Blog posts: MDX files in `content/posts`, validated with Zod at build time
  (`scripts/check-content.ts`) and in tests.
- Portfolio facts: `src/data/profile.ts`, `src/data/work.ts`, `src/data/experience.ts`.
- Admin data: Postgres through Prisma (`prisma/schema.prisma`): the single owner, trusted
  devices, login attempts, audit log, contact messages, comments.

## Cookies

| Host | Cookies |
| --- | --- |
| portfolio, blog | none. Theme preference is localStorage. Analytics is cookieless. |
| admin | Auth.js session and CSRF cookies, `ajd_device` trusted-device cookie. All strictly necessary, host-only. |
