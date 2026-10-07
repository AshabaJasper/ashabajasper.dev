# ashabajasper.dev

The personal site of Ashaba Joshua Jasper (Ashaba Jasper), software engineer and data
scientist in Kampala. One Next.js app serves three hosts:

| Host | What | Code |
| --- | --- | --- |
| `ashabajasper.dev` | Portfolio: work, about, contact | `src/app/portfolio` |
| `blog.ashabajasper.dev` | Writing: MDX posts, tags, feed, moderated comments | `src/app/blog` |
| `admin.ashabajasper.dev` | Private: contact inbox, comment moderation, settings | `src/app/admin` |

`www.ashabajasper.dev` redirects permanently to the apex. `src/middleware.ts` maps the
`Host` header to a site and rewrites each request into that site's folder; see
`docs/ARCHITECTURE.md`.

## Stack

Next.js 15 (App Router, Turbopack), React 19, TypeScript strict, Tailwind CSS v4 with
shadcn/ui (new-york), Prisma 6 on Postgres 16, Auth.js v5 (credentials, owner only),
MDX through next-mdx-remote with Shiki highlighting, Vitest. Self-hosted with Docker on
Coolify. Analytics is self-hosted, cookieless Umami.

## Local development

Requirements: Node 22, Docker (for the dev database), and Chrome, Edge or Firefox
(Safari does not resolve `*.localhost`).

```bash
npm ci
cp .env.example .env                              # then fill AUTH_SECRET and SETUP_TOKEN
docker compose -f docker-compose.dev.yml up -d    # Postgres on 127.0.0.1:5435
npx prisma migrate deploy
npm run dev
```

Generate the two local secrets with `openssl rand -base64 32` (AUTH_SECRET) and
`openssl rand -hex 24` (SETUP_TOKEN). The dev database port can be moved with
`AJDEV_DB_PORT` in your shell; update `DATABASE_URL` to match.

With `ROOT_DOMAIN="localhost:3000"` the three sites are:

- http://localhost:3000 (portfolio)
- http://blog.localhost:3000 (blog)
- http://admin.localhost:3000 (admin; create the owner once at `/setup` with `SETUP_TOKEN`)

Several dev servers can run side by side with their own build folders, for example
`NEXT_DIST_DIR=.next-blog ROOT_DOMAIN=localhost:3102 AUTH_URL=http://admin.localhost:3102 npx next dev --turbopack -p 3102`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with Turbopack |
| `npm run build` | Production build (`prebuild` runs the content check first) |
| `npm run start` | Serve a production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run content:check` | Validate every post in `content/posts` |
| `npm run db:migrate` | `prisma migrate deploy` |
| `npm run db:studio` | Prisma Studio |
| `npm run images` | Resize and compress source images into `public/images` |
| `npm run icons` | Regenerate the favicon and touch icon set |

Before every commit, run typecheck, lint and test separately and read each exit code.
CI (`.github/workflows/ci.yml`) runs the same checks plus the content check on every push
and pull request to `main`.

## Writing

Posts are MDX files in `content/posts`; the filename is the slug. Frontmatter, MDX
features, drafts, series, tags, social images and house style are in
[docs/CONTENT.md](docs/CONTENT.md). Publishing is a commit to `main`.

## Environment variables

Copy `.env.example` to `.env` for development. In production every value lives in the
Coolify application. All are runtime only, except the two `NEXT_PUBLIC_UMAMI_` values,
which are written into the HTML and must be available at build time.

| Variable | Required | When | Meaning |
| --- | --- | --- | --- |
| `DATABASE_URL` | Required | Runtime | Postgres connection string. In production the host is the compose service `db`. |
| `POSTGRES_USER` | Optional (default `ajdev`) | Runtime (db service) | Database user created by the Postgres container. |
| `POSTGRES_PASSWORD` | Required in production | Runtime (db service) | Password for that user. Must match `DATABASE_URL`. |
| `POSTGRES_DB` | Optional (default `ajdev`) | Runtime (db service) | Database name. Must match `DATABASE_URL`. |
| `AUTH_SECRET` | Required | Runtime | Signs admin sessions, form tokens and keys the IP hashes. `openssl rand -base64 32`. |
| `AUTH_URL` | Required | Runtime | Admin origin, `https://admin.ashabajasper.dev` in production. |
| `AUTH_TRUST_HOST` | Required | Runtime | `true`; the app sits behind Coolify's proxy. Fixed in the compose file. |
| `ROOT_DOMAIN` | Required | Runtime (also fixed at build) | Root of all three origins: `ashabajasper.dev` in production, `localhost:3000` locally. |
| `SETUP_TOKEN` | Only for first setup | Runtime | One-time token for `admin.<root>/setup`. Works only while no owner exists. Remove after setup. |
| `ADMIN_EMAIL` | Optional | Runtime | Owner address for notifications when `MAIL_TO` is empty. |
| `SMTP_HOST` | Optional | Runtime | SMTP server for replies and notifications. Email is off unless host, user, password and sender are set. |
| `SMTP_PORT` | Optional (default `465`) | Runtime | SMTP port. |
| `SMTP_SECURE` | Optional (default `true`) | Runtime | `false` for STARTTLS on port 587. |
| `SMTP_USER` | Optional | Runtime | SMTP user name. |
| `SMTP_PASS` | Optional | Runtime | SMTP password. |
| `MAIL_FROM` | Optional | Runtime | Sender address; falls back to `SMTP_USER`. |
| `MAIL_TO` | Optional | Runtime | Where notifications go; falls back to `ADMIN_EMAIL`. |
| `TELEGRAM_BOT_TOKEN` | Optional | Runtime | Bot for a short ping on new messages and comments (never the text). |
| `TELEGRAM_CHAT_ID` | Optional | Runtime | Chat that receives those pings. |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | Optional | Build time | Umami script, `https://stats.ashabajasper.dev/script.js`. Empty means no analytics script. |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | Optional | Build time | The Umami website id for ashabajasper.dev. |
| `TZ` | Optional (default `Africa/Kampala`) | Runtime | Container time zone. |

Secrets never go in the repository, the image or a log. The admin only learns whether
SMTP or Telegram is configured, never the values.

## Deployment

Production runs on an existing Coolify server: `docker-compose.coolify.yml` (app, a
one-shot migrate service and Postgres 16), auto-deployed on every push to `main`. DNS,
Coolify setup, Umami, backups and a verification checklist are in
[DEPLOYMENT.md](DEPLOYMENT.md). Day-to-day operations (rollback, restore, secret rotation,
lockout, spam) are in [docs/RUNBOOK.md](docs/RUNBOOK.md). Launch status against the
website standard is in [docs/WEBSITE_STANDARD_CHECKLIST.md](docs/WEBSITE_STANDARD_CHECKLIST.md).

## Licence

- **Site content** (posts, page copy, images and the design): copyright Ashaba Joshua
  Jasper, all rights reserved.
- **Code samples inside posts:** no reuse licence is granted by this site. Check the
  licence of an associated repository or ask the owner for permission.
- **Fonts:** Geist, Geist Mono and Instrument Serif under the SIL Open Font License 1.1.
  The font files and their licence texts are in `assets/fonts`.
