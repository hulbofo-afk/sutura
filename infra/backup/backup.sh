#!/bin/bash
set -euo pipefail

: "${POSTGRES_HOST:=postgres}"
: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"
: "${BACKUP_PREFIX:=backups/db}"
: "${BACKUP_KEEP_DAILY:=7}"
: "${BACKUP_KEEP_WEEKLY:=4}"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WEEKDAY="$(date -u +%u)"
FILENAME="sutura-${POSTGRES_DB}-${STAMP}.sql.gz"
LOCAL_PATH="/tmp/${FILENAME}"
REMOTE_PATH="${BACKUP_PREFIX}/${FILENAME}"
REMOTE_WEEKLY_PATH="${BACKUP_PREFIX}/weekly/${FILENAME}"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*"
}

log "Starting backup of ${POSTGRES_DB} from ${POSTGRES_HOST}"

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --no-owner \
  --no-privileges \
  --quote-all-identifiers \
  | gzip -9 > "${LOCAL_PATH}"

chmod 0600 "${LOCAL_PATH}"
gzip -t "${LOCAL_PATH}"
log "Dump created and verified: ${LOCAL_PATH} ($(du -h "${LOCAL_PATH}" | cut -f1))"

rclone copyto "${LOCAL_PATH}" "r2:${BACKUP_BUCKET}/${REMOTE_PATH}"
rclone check "${LOCAL_PATH}" "r2:${BACKUP_BUCKET}/${BACKUP_PREFIX}" --one-way --size-only
log "Remote backup verified: ${REMOTE_PATH}"

if [ "${WEEKDAY}" = "7" ]; then
  rclone copyto "${LOCAL_PATH}" "r2:${BACKUP_BUCKET}/${REMOTE_WEEKLY_PATH}"
  rclone check "${LOCAL_PATH}" "r2:${BACKUP_BUCKET}/${BACKUP_PREFIX}/weekly" --one-way --size-only
  log "Weekly snapshot copied"
fi

log "Pruning old backups (keep daily=${BACKUP_KEEP_DAILY}, weekly=${BACKUP_KEEP_WEEKLY})"
rclone delete "r2:${BACKUP_BUCKET}/${BACKUP_PREFIX}/" \
  --exclude "weekly/**" \
  --min-age "${BACKUP_KEEP_DAILY}d" || true
rclone delete "r2:${BACKUP_BUCKET}/${BACKUP_PREFIX}/weekly/" --min-age "$((BACKUP_KEEP_WEEKLY * 7))d" || true

rm -f "${LOCAL_PATH}"
log "Backup complete: ${REMOTE_PATH}"
