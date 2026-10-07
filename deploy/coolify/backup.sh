#!/bin/sh
# Nightly pg_dump of the ashabajasper.dev database, deployed as a Coolify
# application. Coolify names containers <service>-<application uuid>-<timestamp>
# and the timestamp changes on every deploy, so the db container is found by
# prefix. The application uuid lives in ~/ashabajasper-dev-app.uuid.
#
# Install (DEPLOYMENT.md, Backups):
#   install -m 700 deploy/coolify/backup.sh ~/ashabajasper-dev-backup.sh
#   crontab -e, then add:
#   10 3 * * * $HOME/ashabajasper-dev-backup.sh >> $HOME/backups/ashabajasper-dev-backup.log 2>&1
# Restore: docs/RUNBOOK.md.
#
# POSIX sh, no bashisms. Needs passwordless `sudo docker` for this user.
set -eu
umask 077

OUT="$HOME/backups"
UUID_FILE="$HOME/ashabajasper-dev-app.uuid"
MIN_BYTES=10240
KEEP_DAYS=14

mkdir -p "$OUT"

[ -r "$UUID_FILE" ] || { echo "$(date -Is) $UUID_FILE is missing"; exit 1; }
UUID=$(tr -d '[:space:]' < "$UUID_FILE")
[ -n "$UUID" ] || { echo "$(date -Is) $UUID_FILE is empty"; exit 1; }

DB=$(sudo -n docker ps --format '{{.Names}}' | grep "^db-$UUID" | head -n 1 || true)
[ -n "$DB" ] || { echo "$(date -Is) ashabajasper-dev db container is not running"; exit 1; }

STAMP=$(date -u +%Y%m%d-%H%M)
FILE="$OUT/ashabajasper-dev-$STAMP.dump"

# Credentials come from the container's own environment, never from this file.
sudo -n docker exec "$DB" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$FILE"

# A dump this small means something went wrong; keep the older dumps in that case.
SIZE=$(wc -c < "$FILE" | tr -d '[:space:]')
if [ "$SIZE" -lt "$MIN_BYTES" ]; then
  echo "$(date -Is) $FILE is only $SIZE bytes, not pruning older dumps"
  exit 1
fi

echo "$(date -Is) wrote $FILE ($SIZE bytes)"
find "$OUT" -name 'ashabajasper-dev-2*.dump' -type f -mtime +"$KEEP_DAYS" -exec rm -f {} +
