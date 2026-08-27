#!/bin/bash
set -euo pipefail

: "${R2_BUCKET:?R2_BUCKET is required}"
: "${BACKUP_PREFIX:=backups/db}"

usage() {
  echo "Usage: $0 [--list] [--file <filename>] [--latest] [--confirm]"
  echo ""
  echo "  --list              List available backups"
  echo "  --file <filename>   Restore the given backup file"
  echo "  --latest            Restore the most recent backup"
  echo "  --confirm           Required before overwriting the live database"
  exit 1
}

LIST=false
FILE=""
LATEST=false
CONFIRM=false

while [ $# -gt 0 ]; do
  case "$1" in
    --list) LIST=true ;;
    --file) FILE="$2"; shift 2 ;;
    --latest) LATEST=true ;;
    --confirm) CONFIRM=true ;;
    *) usage ;;
  esac
done

if [ "$LIST" = true ]; then
  echo "Daily backups:"
  rclone lsf "r2:${R2_BUCKET}/${BACKUP_PREFIX}/" --files-only | sort
  echo ""
  echo "Weekly backups:"
  rclone lsf "r2:${R2_BUCKET}/${BACKUP_PREFIX}/weekly/" --files-only | sort
  exit 0
fi

if [ "$LATEST" = true ]; then
  FILE=$(rclone lsf "r2:${R2_BUCKET}/${BACKUP_PREFIX}/" --files-only | sort | tail -1)
  if [ -z "$FILE" ]; then
    echo "No backup found"
    exit 1
  fi
  echo "Latest backup: $FILE"
fi

if [ -z "$FILE" ]; then
  usage
fi

if [ "$CONFIRM" != true ]; then
  echo "Restore is destructive; rerun with --confirm after stopping the API." >&2
  exit 2
fi
if [[ "$FILE" == */* || "$FILE" != *.sql.gz ]]; then
  echo "Backup filename must be a plain .sql.gz filename" >&2
  exit 1
fi

LOCAL_PATH="/tmp/restore-${FILE}"
trap 'rm -f "${LOCAL_PATH}"' EXIT

rclone copyto "r2:${R2_BUCKET}/${BACKUP_PREFIX}/${FILE}" "${LOCAL_PATH}"
gzip -t "${LOCAL_PATH}"

echo "Restoring into ${POSTGRES_DB} on ${POSTGRES_HOST}..."
gunzip -c "${LOCAL_PATH}" | PGPASSWORD="${POSTGRES_PASSWORD}" psql \
  -h "${POSTGRES_HOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  --single-transaction \
  --variable=ON_ERROR_STOP=1

echo "Restore complete"
