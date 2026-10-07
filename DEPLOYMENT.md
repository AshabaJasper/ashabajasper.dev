# Deployment

Production runs as one Coolify application on the existing Coolify server (a VPS), built
from `docker-compose.coolify.yml` in the public GitHub repository
`AshabaJasper/ashabajasper.dev` and redeployed on every push to `main`, as approved by the owner.

This document never holds real secrets, the server IP, user names or Coolify uuids.
Placeholders: `<VPS_IP>` is the server's public IPv4 address, `<COOLIFY_URL>` is the
address of the Coolify dashboard, `<user>` is your login on the server.

Contents:

1. [What runs](#1-what-runs)
2. [DNS at Hostinger](#2-dns-at-hostinger)
3. [The Coolify application](#3-the-coolify-application)
4. [Environment variables](#4-environment-variables)
5. [Auto-deploy webhook](#5-auto-deploy-webhook)
6. [First deploy](#6-first-deploy)
7. [One-time owner setup](#7-one-time-owner-setup)
8. [Analytics: Umami at stats.ashabajasper.dev](#8-analytics-umami-at-statsashabajasperdev)
9. [Backups](#9-backups)
10. [Verification checklist](#10-verification-checklist)
11. [Doing everything through the Coolify web UI](#11-doing-everything-through-the-coolify-web-ui)

Day-2 operations (rollback, restore, rotating secrets, lockout, spam, logs) are in
[docs/RUNBOOK.md](docs/RUNBOOK.md).

## 1. What runs

| Compose service | Image | Role |
| --- | --- | --- |
| `app` | `Dockerfile` target `runner` | The Next.js server on port 3000 for all four domains. Health check: `GET /api/health`. |
| `migrate` | `Dockerfile` target `tools` | One-shot `npx prisma migrate deploy`, then exits. |
| `db` | `postgres:16-alpine` | Postgres with the volume `ajdev-pgdata`. Never published to the internet. |

On each deploy: `db` becomes healthy, `migrate` applies pending migrations and exits,
then `app` starts. A failed migration fails the deploy instead of starting the app
against a schema it does not match. Coolify's Traefik terminates TLS with Let's Encrypt
and forwards the domains on the `app` service to port 3000. No service publishes a port.

## 2. DNS at Hostinger

In hPanel, open Domains, `ashabajasper.dev`, DNS / Nameservers, and set these records.
First delete any default Hostinger records for `@` and `www` that point elsewhere (a
parking A record or a `www` CNAME), or they will conflict.

| Type | Name | Points to | TTL |
| --- | --- | --- | --- |
| A | `@` | `<VPS_IP>` | 300 |
| A | `os` | `<VPS_IP>` | 300 |
| A | `blog` | `<VPS_IP>` | 300 |
| A | `admin` | `<VPS_IP>` | 300 |
| A | `stats` | `<VPS_IP>` | 300 |
| CNAME | `www` | `ashabajasper.dev` | 300 |

The `os` record serves the separate private Jasper OS application. Keep it configured;
it is not added as a domain of this public application.

**Wait for DNS before adding domains in Coolify.** Coolify asks Let's Encrypt for a
certificate as soon as a domain is saved, and Let's Encrypt rate-limits failed
challenges (five failures per hostname per hour). Check from your own machine until
every name answers with the server address:

```bash
for h in ashabajasper.dev www.ashabajasper.dev blog.ashabajasper.dev admin.ashabajasper.dev stats.ashabajasper.dev; do
  printf '%s ' "$h"; dig +short "$h" A | tail -n 1
done
```

Every line must end in `<VPS_IP>` (the `www` line shows it after the CNAME). `.dev` is
on the browser HSTS preload list, so the sites only open over HTTPS: until the
certificates exist, browsers show an error rather than an unencrypted page.

## 3. The Coolify application

In `<COOLIFY_URL>`, inside the project and environment you use for production:

1. **New resource**, then **Public Repository**, URL
   `https://github.com/AshabaJasper/ashabajasper.dev`.
2. **Branch:** `main`. **Build pack:** Docker Compose. **Docker Compose location:**
   `/docker-compose.coolify.yml`. Base directory `/`.
3. Save, then open the application's configuration. Coolify lists the compose services.
   On the **`app`** service set **Domains** to exactly:

   ```
   https://ashabajasper.dev,https://www.ashabajasper.dev,https://blog.ashabajasper.dev,https://admin.ashabajasper.dev
   ```

   Leave `migrate` and `db` without domains.
4. Keep the application uuid (it is in the dashboard URL of the application). The backup
   script needs it on the server in `~/ashabajasper-dev-app.uuid` (section 9).

`www` reaches the app and the app answers with a permanent redirect to the apex, so no
redirect rule is needed in Coolify.

## 4. Environment variables

Set these under the application's **Environment Variables**. Generate every secret on
the server, not on a laptop, and paste it straight into Coolify:

```bash
openssl rand -base64 32   # AUTH_SECRET
openssl rand -hex 24      # POSTGRES_PASSWORD (hex keeps DATABASE_URL free of characters that need escaping)
openssl rand -hex 24      # SETUP_TOKEN
```

| Variable | Value in production | Build time? |
| --- | --- | --- |
| `POSTGRES_USER` | `ajdev` | No |
| `POSTGRES_PASSWORD` | generated, required | No |
| `POSTGRES_DB` | `ajdev` | No |
| `DATABASE_URL` | `postgresql://ajdev:<POSTGRES_PASSWORD>@db:5432/ajdev?schema=public` (host is the service `db`) | No |
| `AUTH_SECRET` | generated | No |
| `AUTH_URL` | `https://admin.ashabajasper.dev` | No |
| `AUTH_TRUST_HOST` | fixed to `true` in the compose file, nothing to set | No |
| `ROOT_DOMAIN` | `ashabajasper.dev` | No |
| `SETUP_TOKEN` | generated; remove after section 7 | No |
| `ADMIN_EMAIL` | the owner's address, if email notifications are wanted | No |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAIL_TO` | optional; leave unset to keep email off | No |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | optional; both or neither | No |
| `TZ` | `Africa/Kampala` (also the default) | No |
| `NEXT_PUBLIC_UMAMI_SCRIPT_URL` | `https://stats.ashabajasper.dev/script.js` (section 8) | **Yes** |
| `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | the Umami website id (section 8) | **Yes** |

Everything is **runtime only** (untick "Build Variable" / "Available at build time"),
so no secret is baked into an image layer. The two `NEXT_PUBLIC_UMAMI_` values are the
only exception: they are public, they are written into the HTML during `next build`,
and the compose file passes them as build args. Mark both as available at build time.
A change to either needs a redeploy (a rebuild), not a restart.

The meaning of every variable is in the README table and `.env.example`.

## 5. Auto-deploy webhook

A public repository is not connected through a GitHub App, so Coolify learns about pushes
from a manual webhook:

1. In Coolify, open the application, **Webhooks**. Copy the manual GitHub webhook URL
   (`<COOLIFY_URL>/webhooks/source/github/events/manual`) and set a **GitHub Webhook
   Secret** (generate one with `openssl rand -hex 32`). Save.
2. In GitHub, `AshabaJasper/ashabajasper.dev`, **Settings**, **Webhooks**, **Add
   webhook**: payload URL from step 1, content type `application/json`, the same secret,
   "Just the push event", active.
3. GitHub sends a ping; the webhook list should show a green tick. Pushes to branches
   other than `main` are ignored by Coolify.

## 6. First deploy

1. Confirm DNS (section 2) and the variables (section 4), with the two Umami values
   still empty: analytics comes after the site is up.
2. Press **Deploy**. The build runs `npm ci`, `prisma generate`, the content check and
   `next build`; expect several minutes on the first run.
3. In the deployment log, check that `migrate` printed "All migrations have been
   successfully applied" (or "No pending migrations") and exited 0, and that `app`
   turned healthy.
4. Run the checks in section 10.

## 7. One-time owner setup

1. Open `https://admin.ashabajasper.dev/setup`.
2. Enter the `SETUP_TOKEN` from Coolify, the owner's name, email and a long password.
   The page only works while no owner exists; after that it refuses every request.
3. Sign in at `https://admin.ashabajasper.dev`, and optionally set a PIN for this
   trusted device in Settings.
4. **Remove `SETUP_TOKEN`** from the Coolify variables and **Redeploy** the application
   (a Restart is not guaranteed to recreate the container with the changed variables).
5. Confirm it is gone from the running container. In Coolify, the application,
   **Terminal**, service `app`, run `printenv SETUP_TOKEN`: it must print nothing. The
   `/setup` page cannot show this any more, because it already reports "Setup is
   complete" once the owner exists.

## 8. Analytics: Umami at stats.ashabajasper.dev

Umami is cookieless and stores no personal data, which is why the site needs no cookie
banner (see the checklist). It runs as a separate Coolify service, not inside this
application.

1. In the same Coolify project: **New resource**, **Services**, search **Umami**, add it
   (Umami with its own Postgres).
2. On the `umami` service set the domain to `https://stats.ashabajasper.dev:3000` (the
   port tells Traefik where Umami listens; visitors still use port 443). Deploy it.
3. **Immediately** sign in at `https://stats.ashabajasper.dev` with Umami's default
   login (`admin` / `umami`) and change the password in Settings, Profile. Store the new
   one in your password manager.
4. Settings, Websites, **Add website**: name `ashabajasper.dev`, domain
   `ashabajasper.dev`. Open it and copy the **Website ID**. The tracker is configured
   with `data-domains` for the apex and the blog, so one website covers both; the admin
   host never loads it.
5. In the ashabajasper.dev application set:
   - `NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://stats.ashabajasper.dev/script.js`
   - `NEXT_PUBLIC_UMAMI_WEBSITE_ID=<the id from step 4>`

   both marked available at build time, then **Redeploy** (a rebuild).
6. Open the portfolio, a blog post and the contact page; within a minute the Umami
   realtime view should show the visits. Sending a test message through the contact
   form should record one `contact-sent` event and nothing else about the sender.

## 9. Backups

Coolify does not back up this database by itself. `deploy/coolify/backup.sh` writes a
nightly `pg_dump -Fc` to `~/backups/ashabajasper-dev-<stamp>.dump`, keeps 14 days, and
refuses to prune if the new dump is under 10 KB. It needs passwordless `sudo docker` for
your user, like the other backup scripts on the server.

On the server, from a checkout or a copy of the script:

```bash
echo '<application uuid from section 3>' > ~/ashabajasper-dev-app.uuid
chmod 600 ~/ashabajasper-dev-app.uuid
install -m 700 deploy/coolify/backup.sh ~/ashabajasper-dev-backup.sh
~/ashabajasper-dev-backup.sh            # run once by hand, it should print "wrote ..."
crontab -e
```

and add:

```
10 3 * * * $HOME/ashabajasper-dev-backup.sh >> $HOME/backups/ashabajasper-dev-backup.log 2>&1
```

**Restore** (the full procedure, with a safety dump first, is in `docs/RUNBOOK.md`):

```bash
U=$(cat ~/ashabajasper-dev-app.uuid); DB=$(sudo docker ps --format '{{.Names}}' | grep "^db-$U" | head -n 1)
sudo docker exec -i "$DB" sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl' < ~/backups/ashabajasper-dev-<stamp>.dump
sudo docker restart "$(sudo docker ps --format '{{.Names}}' | grep "^app-$U" | head -n 1)"
```

Copy a recent dump off the server now and then (for example with `scp` to an encrypted
disk); a backup on the same VPS does not survive losing the VPS.

## 10. Verification checklist

Run from any machine after each first deploy and after any infrastructure change.

**Portfolio, `ashabajasper.dev`:**

```bash
curl -sI https://ashabajasper.dev | head -n 1                      # HTTP/2 200
curl -sI https://ashabajasper.dev | grep -i strict-transport       # HSTS present
curl -sI https://ashabajasper.dev | grep -ci set-cookie            # 0: no cookies on public hosts
curl -s  https://ashabajasper.dev/api/health                       # {"ok":true}
curl -sI https://ashabajasper.dev/no-such-page | head -n 1         # HTTP/2 404
curl -s  https://ashabajasper.dev/robots.txt                       # Sitemap: https://ashabajasper.dev/sitemap.xml
curl -s  https://ashabajasper.dev/sitemap.xml | head -n 5          # absolute https://ashabajasper.dev URLs
curl -s  https://ashabajasper.dev | grep -o '<meta property="og:image" content="[^"]*"'
curl -s  https://ashabajasper.dev | grep -c stats.ashabajasper.dev # 1 once Umami is configured
```

**www, `www.ashabajasper.dev`:**

```bash
curl -sI https://www.ashabajasper.dev/about | grep -iE '^(HTTP|location)'   # 308, location https://ashabajasper.dev/about
```

**Blog, `blog.ashabajasper.dev`:**

```bash
curl -sI https://blog.ashabajasper.dev | head -n 1                 # HTTP/2 200
curl -sI https://blog.ashabajasper.dev | grep -ci set-cookie       # 0
curl -s  https://blog.ashabajasper.dev/robots.txt                  # Sitemap: https://blog.ashabajasper.dev/sitemap.xml
curl -s  https://blog.ashabajasper.dev/sitemap.xml | head -n 5
curl -sI https://blog.ashabajasper.dev/feed.xml | head -n 1        # HTTP/2 200
curl -sI https://blog.ashabajasper.dev/no-such-post | head -n 1    # HTTP/2 404
curl -sI https://blog.ashabajasper.dev/api/contact | head -n 1     # HTTP/2 404 (contact is portfolio only)
```

**Admin, `admin.ashabajasper.dev`:**

```bash
curl -sI https://admin.ashabajasper.dev | grep -iE '^(HTTP|location|x-robots-tag)'   # redirect to sign-in, X-Robots-Tag: noindex, nofollow
curl -s  https://admin.ashabajasper.dev/robots.txt                                   # Disallow: /
curl -s  https://admin.ashabajasper.dev/api/health                                   # {"ok":true}
```

**In a browser** (Chrome, at 375 px and 1440 px): the home page CTA, a blog post with a
code block, the contact form (a validation error, then a real message that reaches
`/contact/thanks` and appears in the admin inbox), a comment that waits for moderation,
the 404 page on each host, light and dark theme. Record results in
`docs/WEBSITE_STANDARD_CHECKLIST.md`.

**Social cards:** paste `https://ashabajasper.dev` and a post URL into the LinkedIn Post
Inspector and the opengraph.xyz preview; each should show its own image and title.

## 11. Doing everything through the Coolify web UI

For setting up or repairing production without a terminal on the server. Steps that
genuinely need a shell (installing the backup cron, restoring a dump) are marked.

1. **DNS:** in Hostinger hPanel add the records from section 2. Check them with an
   online DNS lookup (for example dnschecker.org) until every name shows `<VPS_IP>`.
   Do not go past step 3 until they all do: saving a domain in step 4 starts the
   certificate request.
2. **Coolify login:** open `<COOLIFY_URL>` and sign in.
3. **Create the application:** Projects, your production project and environment,
   **+ New**, **Public Repository**, paste `https://github.com/AshabaJasper/ashabajasper.dev`,
   Check repository, branch `main`, build pack **Docker Compose**, compose location
   `/docker-compose.coolify.yml`, Continue.
4. **Domains:** in the application's Configuration, under the `app` service, paste the
   four domains from section 3 into Domains. Save.
5. **Secrets:** Coolify needs generated values but has no generator. Use the
   **Terminal** tab of any running resource on the server (Coolify opens a shell in the
   browser) and run the `openssl rand` commands from section 4, or use a password
   manager's generator with letters and digits only.
6. **Variables:** Environment Variables, **Developer view**, paste the variables from
   section 4 as `NAME=value` lines, Save. Then open each `NEXT_PUBLIC_UMAMI_` variable
   and tick "Build Variable"; make sure no other variable has it ticked.
7. **Webhook:** Webhooks tab, set the GitHub webhook secret, Save, copy the manual
   GitHub URL. In GitHub, Settings, Webhooks, add it as in section 5.
8. **Deploy:** press **Deploy**, open the deployment, follow the logs until `app` is
   healthy. If it fails, the log names the step: build, `migrate` or health check.
9. **Owner:** open `https://admin.ashabajasper.dev/setup`, complete it with the
   `SETUP_TOKEN`, sign in, then delete `SETUP_TOKEN` in Environment Variables, press
   **Redeploy**, and check `printenv SETUP_TOKEN` prints nothing in the `app` Terminal
   (section 7, step 5).
10. **Umami:** **+ New**, **Services**, Umami. Domain `https://stats.ashabajasper.dev:3000`,
    Deploy. Sign in at the stats domain and change the default password before doing
    anything else (until then anyone can sign in with it), then add the website and
    copy its id.
11. **Analytics on:** set the two `NEXT_PUBLIC_UMAMI_` variables (section 8, step 5), keep
    them as build variables, press **Redeploy**.
12. **Check:** run the browser parts of section 10; for the curl lines, use the
    Terminal tab or any machine with curl.
13. **Backups (needs a shell):** the backup script runs from the server's crontab, which
    the Coolify UI does not manage. Use the Coolify Terminal on the server host (Servers,
    your server, Terminal) to run the commands in section 9. Coolify's own "Scheduled
    Tasks" run inside a container and cannot write to `~/backups` on the host, so they
    are not a replacement.
14. **Rollback:** Deployments tab, pick an earlier successful deployment, **Redeploy**
    (details in `docs/RUNBOOK.md`).
