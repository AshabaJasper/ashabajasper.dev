# Runbook

Day-2 operations for production. Setup from scratch is in `DEPLOYMENT.md`.

Commands on the server assume the application uuid is in `~/ashabajasper-dev-app.uuid`
(DEPLOYMENT.md section 9). Coolify names containers `<service>-<uuid>-<timestamp>` and
the timestamp changes on every deploy, so every command finds containers by prefix:

```bash
U=$(cat ~/ashabajasper-dev-app.uuid)
APP=$(sudo docker ps --format '{{.Names}}' | grep "^app-$U" | head -n 1)
DB=$(sudo docker ps --format '{{.Names}}' | grep "^db-$U" | head -n 1)
```

## Deploy

A push to `main` is the release: CI runs the checks, and Coolify's webhook builds and
deploys. Nothing else is needed for content or code changes.

1. Locally: `npm run typecheck`, `npm run lint`, `npm test`, `npm run content:check`,
   each on its own, reading every exit code.
2. **If the push contains a migration**, take a backup first:
   `~/ashabajasper-dev-backup.sh` on the server. Migrations in this repo only add; one
   that drops or rewrites data needs a deliberate decision and a fresh backup.
3. `git push origin main`.
4. Watch the deployment in Coolify (application, Deployments). `migrate` must exit 0 and
   `app` must turn healthy.
5. Spot-check with the curl lines in DEPLOYMENT.md section 10.

A manual redeploy without a push: Coolify, the application, **Redeploy**. After changing
any environment variable, **Redeploy**: a Restart is not guaranteed to recreate the
containers with the new values, and the two `NEXT_PUBLIC_UMAMI_` values are baked in at
build time anyway. Confirm a runtime change took effect with `printenv <NAME>` in the
`app` service's Terminal in Coolify (it prints the value, so never paste the output
anywhere).

## Roll back to a previous commit

Code first, the database only if it was damaged.

- **Fastest, through Coolify:** the application, **Deployments**, open the last good
  deployment and press **Redeploy** (or use **Rollback** in the application's
  configuration, which lists the images Coolify still holds). This rebuilds or restarts
  that commit without touching Git.
- **Lasting, through Git:** revert the bad commit and push, so `main` and production
  agree again and the next push does not bring the problem back:

  ```bash
  git revert <bad-commit>
  git push origin main
  ```

- **Migrations are never rolled back.** They only add tables and columns, so older code
  runs against the newer schema. If a migration damaged data, restore a backup (next
  section) and then deploy the fixed code.

## Restore a backup

Dumps are in `~/backups/ashabajasper-dev-<UTC stamp>.dump`, one a night, 14 days kept.

```bash
ls -lh ~/backups/ashabajasper-dev-*.dump | tail -n 5

# 1. Safety copy of the current state, even if it is broken.
~/ashabajasper-dev-backup.sh

# 2. Stop the app so nothing writes during the restore.
sudo docker stop "$APP"

# 3. Restore. --clean drops and recreates objects in the dump.
sudo docker exec -i "$DB" sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl' < ~/backups/ashabajasper-dev-<stamp>.dump

# 4. Start the app again and check it.
sudo docker start "$APP"
curl -s https://ashabajasper.dev/api/health
```

If the restored dump is older than the latest migration, the next deploy's `migrate`
step applies the missing migrations. Then sign in to the admin and check the inbox and
comments look as expected.

## Rotate AUTH_SECRET

Do it if the secret may have leaked, or as routine hygiene. Effects:

- **Signs everyone out:** existing admin sessions stop validating. Sign in again with the
  password; trusted devices keep working for the PIN screen, because device tokens are
  random values stored as SHA-256 hashes, not signed with the secret.
- **Invalidates form tokens in flight:** a visitor who had the contact or comment form
  open gets an error on submit and must reload. Their entries stay in the form.
- **Breaks IP hash continuity:** sender IPs are stored as an HMAC keyed by the secret.
  After rotation the same visitor hashes differently, so rate limits restart and new
  messages can no longer be matched to older ones by sender. Old hashes are cleared
  after 30 days anyway.

Steps:

1. On the server: `openssl rand -base64 32`.
2. Coolify, the application, Environment Variables: replace `AUTH_SECRET` (runtime only),
   Save.
3. **Redeploy** the application, so the containers are recreated with the new value.
4. Sign in at `https://admin.ashabajasper.dev` and send a test message through the
   contact form.

## Reset the owner password (locked out)

Five wrong passwords in 15 minutes lock the email for the rest of that window; waiting
15 minutes is the first fix. If the password itself is lost, reset it with a one-off
tools container. The script reads the new password from `NEW_OWNER_PASSWORD`, set for
that one command only, never typed into the command line, a file or `.env`, and it
prompts for nothing:

```bash
U=$(cat ~/ashabajasper-dev-app.uuid)
APP=$(sudo docker ps --format '{{.Names}}' | grep "^app-$U" | head -n 1)
TOOLS=$(sudo docker inspect --format '{{.Image}}' "$(sudo docker ps -a --format '{{.Names}}' | grep "^migrate-$U" | head -n 1)")

printf 'New owner password: '; stty -echo; read -r NEW_OWNER_PASSWORD; stty echo; echo
DATABASE_URL=$(sudo docker exec "$APP" printenv DATABASE_URL)
export NEW_OWNER_PASSWORD DATABASE_URL
sudo --preserve-env=NEW_OWNER_PASSWORD,DATABASE_URL docker run --rm --network "$U" \
  -e NEW_OWNER_PASSWORD -e DATABASE_URL \
  "$TOOLS" npx tsx scripts/reset-owner-password.ts
unset NEW_OWNER_PASSWORD DATABASE_URL
```

`-e NAME` without a value copies it from the environment, so neither the new password
nor the database password appears in `ps` or the shell history. Afterwards sign in with the new password and check
Settings for trusted devices you do not recognise.

`scripts/reset-owner-password.ts` updates the single owner's bcrypt hash, clears the
recent failed sign-in attempts for that email, writes an audit entry, and prints only
whether it succeeded. If it is not in the repository yet, it must be added before this
procedure works.

## Moderate a spam wave

The forms already reject most bots silently: a honeypot field, a form token that must be
3 seconds to 2 hours old, an `Origin` check, and rate limits per sender (5 a minute,
then 3 messages an hour or 10 comments a day). Comments never appear before approval.

When spam still gets through:

1. **Admin inbox:** mark unwanted messages as Spam; archive rather than reply. Comments
   stay unpublished until you approve them, so ignoring or rejecting them is enough.
2. **Notifications flooding:** remove `TELEGRAM_BOT_TOKEN` (or the SMTP variables) in
   Coolify and **Redeploy**. Messages still land in the inbox; put the values back once
   the wave passes.
3. **A sustained wave from one source:** the IP is stored only as a hash, so blocking
   happens in front of the app. Add a rate limit or IP allow/deny middleware on the `app`
   service's Traefik labels in Coolify, or at the VPS firewall, and remove it afterwards.
4. **Never** paste spam content, sender emails or IPs into issues, commits or posts.

## Where the logs are

| What | Where |
| --- | --- |
| Build and deploy | Coolify, the application, **Deployments**, each deployment's log. |
| Running app (Next.js server, API errors) | Coolify, the application, **Logs**, service `app`; or `sudo docker logs --tail 100 "$APP"`. |
| Migrations | Coolify Logs, service `migrate`; or `sudo docker logs $(sudo docker ps -a --format '{{.Names}}' \| grep "^migrate-$U" \| head -n 1)`. |
| Database | Coolify Logs, service `db`; or `sudo docker logs --tail 100 "$DB"`. |
| Container health | `sudo docker inspect --format '{{.State.Health.Status}}' "$APP"`. |
| Backups | `~/backups/ashabajasper-dev-backup.log` on the server. |
| Sign-ins, setup, settings changes, moderation | The admin audit log (`AuditLog` table), visible in the admin. |
| Visits and conversion events | Umami at `https://stats.ashabajasper.dev`. |

Container logs use the json-file driver capped at 5 files of 10 MB per service, so they
cover days, not months. Logs never contain secrets, passwords, PINs, raw IP addresses or
message bodies; if you ever see one, treat it as a bug and rotate what leaked.
