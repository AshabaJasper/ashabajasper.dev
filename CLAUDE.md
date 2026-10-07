# Working on ashabajasper.dev

One Next.js 15 App Router app (React 19, TypeScript strict, Tailwind v4, shadcn new-york,
Prisma 6 on Postgres 16, Auth.js v5 credentials, Vitest) that serves three hosts:

| Host | Folder | What |
| --- | --- | --- |
| `ashabajasper.dev` | `src/app/portfolio` | portfolio |
| `blog.ashabajasper.dev` | `src/app/blog` | MDX blog with moderated comments |
| `admin.ashabajasper.dev` | `src/app/admin` | private inbox, comment moderation, settings |

`src/middleware.ts` maps the Host header to a site with `src/lib/sites.ts` and rewrites
every path into that folder. Read `docs/ARCHITECTURE.md` before structural work and
`DESIGN.md` before UI work.

## Hard rules

- **No em dashes anywhere**: code, comments, copy, posts, docs, commit messages. Use a
  comma, a colon or a new sentence. `tests/no-em-dash.test.ts` enforces it.
- **Never invent facts** about the owner, clients, metrics or dates. Unknown values stay
  out of the page and go on the launch-blocker list in `docs/WEBSITE_STANDARD_CHECKLIST.md`.
- **Absolute URLs come from `siteUrl()` / `siteOrigin()`**, never from request headers and
  never with the internal `/portfolio`, `/blog` or `/admin` prefix. Same-host links stay
  relative; cross-host links use `crossHref()` from `src/lib/links.ts`.
- **No file-convention `robots.ts`, `sitemap.ts` or `opengraph-image.tsx`.** Each site has
  explicit route handlers (`robots.txt/route.ts`, `sitemap.xml/route.ts`, `og/.../route.tsx`).
- **Zod:** no `.default()` and no `z.coerce`. A schema's input type equals its output type.
- **Server actions** go through `action(schema, handler)` from `src/actions/safe-action.ts`,
  call `audit()`, then revalidate.
- **Client files must not reach server code.** A `"use client"` file may not import, even
  indirectly, Prisma, `@/lib/auth`, `@/lib/og`, nodemailer or anything marked
  `server-only`. `tests/client-boundary.test.ts` catches this.
- **Public hosts set no cookies.** Theme lives in localStorage. Session and device cookies
  exist only on the admin host. Analytics is cookieless Umami. Keep it that way, or the
  cookie banner decision in the checklist must be revisited.
- **Personal data:** contact and comment senders are stored with an HMAC of the IP, never
  the raw IP, and the hash is cleared after 30 days. Comment emails are never rendered
  publicly. No personal data in URLs or analytics events.
- **The PIN** is a bcrypt hash only, never accepted without a trusted-device token, never
  written to a file, a log or `.env`.
- **Secrets live only in the environment.** Every new env var goes in `.env.example`, the
  `docker-compose.coolify.yml` passthrough, the README env table and `DEPLOYMENT.md`.
- **Every page** exports a title and its own description, and every icon-only button has
  an `aria-label` (`tests/page-metadata.test.ts`, `tests/icon-buttons.test.ts`).
- **Website standard:** keep `docs/WEBSITE_STANDARD_CHECKLIST.md` current.

## Commands

```bash
docker compose -f docker-compose.dev.yml up -d   # dev Postgres on 127.0.0.1:5435
npm run dev                                      # http://localhost:3000, http://blog.localhost:3000, http://admin.localhost:3000
npm run typecheck
npm run lint
npm run test
npm run build
```

Run typecheck, lint and test separately before every commit and read each exit code.

## Gotchas

- The repo lives in OneDrive. Delete `.next` if a build behaves strangely.
- Safari does not resolve `*.localhost`; use Chrome, Edge or Firefox locally.
- Writing files through a shell heredoc mangles quotes. Use an editor tool or a script file.
- `usePathname()` can report the internal path during server rendering after a rewrite;
  pass it through `publicPath()` from `src/lib/links.ts`.

## Commits

`Area: description` as the subject, a body that explains why, what was left out and what
was verified. `main` deploys production through Coolify on push.
