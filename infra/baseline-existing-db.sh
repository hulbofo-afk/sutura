#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

DEPLOY_LOCK_FILE="${DEPLOY_LOCK_FILE:-/tmp/sutura-deploy.lock}"
command -v flock >/dev/null 2>&1 || {
  echo "flock is required to serialize production operations" >&2
  exit 1
}
exec 9>"${DEPLOY_LOCK_FILE}"
flock -n 9 || {
  echo "Another Sutura deployment or baseline operation is already running" >&2
  exit 1
}

if [ ! -f .env.production ]; then
  echo "Missing infra/.env.production. Copy .env.production.example and fill it in." >&2
  exit 1
fi

set -a
source .env.production
set +a

echo "==> Checking the existing PostgreSQL schema"
compose_stderr="$(mktemp)"
trap 'rm -f "${compose_stderr}"' EXIT
if ! schema_shape="$(docker compose -f docker-compose.yml exec -T postgres \
    psql -AtXqc "
      SELECT CASE WHEN
        to_regclass('public._prisma_migrations') IS NULL
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User')
        AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'emailVerifyToken')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'sessionVersion')
        AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'PublicResponse' AND column_name = 'idempotencyKey')
        AND NOT EXISTS (
          SELECT 1
          FROM pg_constraint c
          JOIN pg_class t ON t.oid = c.conrelid
          JOIN pg_namespace n ON n.oid = t.relnamespace
          WHERE n.nspname = 'public' AND t.relname = 'Question' AND c.conname = 'Question_modelId_fkey'
        )
      THEN 'legacy' ELSE 'unexpected' END;
    " "${POSTGRES_DB}" "${POSTGRES_USER}" 2>"${compose_stderr}")"; then
  cat "${compose_stderr}" >&2
  echo "Unable to inspect the existing PostgreSQL schema safely." >&2
  exit 1
fi

if [ -s "${compose_stderr}" ]; then
  cat "${compose_stderr}" >&2
fi

if [ "${schema_shape}" != "legacy" ]; then
  echo "Unexpected database shape; refusing to baseline automatically." >&2
  echo "Expected an existing legacy schema with no _prisma_migrations table." >&2
  exit 1
fi

if [ "${CONFIRM_LEGACY_BASELINE:-}" != "I_UNDERSTAND" ]; then
  echo "Schema matches the legacy baseline." 
  echo "This operation records migration history and applies additive columns." 
  echo "After taking a verified backup, rerun with CONFIRM_LEGACY_BASELINE=I_UNDERSTAND." 
  exit 2
fi

echo "==> Verifying a PostgreSQL backup before baseline"
docker compose -f docker-compose.yml run --rm --no-deps \
  --entrypoint /usr/local/bin/backup.sh backup

echo "==> Recording the legacy baseline"
docker compose -f docker-compose.yml run --rm --entrypoint npx migrate \
  prisma migrate resolve --applied 20260803000000_init

echo "==> Applying the additive current-MVP migration"
docker compose -f docker-compose.yml run --rm migrate

echo "Baseline and additive migration completed. Verify /api/health/ready before restarting the API."
