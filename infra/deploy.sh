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
  echo "Missing infra/.env.production. Copy .env.production.example and fill it in."
  exit 1
fi

set -a
source .env.production
set +a

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "Missing required production variable: ${name}" >&2
    exit 1
  fi
}

reject_placeholder() {
  local name="$1"
  local value="${!name:-}"
  case "${value}" in
    change-me*|your-*|*example*|unused@nowhere.local)
      echo "Production variable ${name} still contains a placeholder" >&2
      exit 1
      ;;
  esac
}

for name in API_IMAGE POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB JWT_SECRET \
  PUBLIC_APP_URL API_PUBLIC_URL CORS_ORIGINS CADDY_PRIMARY_DOMAIN ACME_EMAIL \
  LOCAL_UPLOAD_SECRET R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY \
  R2_BUCKET R2_PUBLIC_BASE_URL SMTP_HOST SMTP_FROM; do
  require_env "${name}"
done

if [ "${#JWT_SECRET}" -lt 32 ]; then
  echo "JWT_SECRET must contain at least 32 characters" >&2
  exit 1
fi
if [ "${#LOCAL_UPLOAD_SECRET}" -lt 32 ]; then
  echo "LOCAL_UPLOAD_SECRET must contain at least 32 characters" >&2
  exit 1
fi
if [ "${#POSTGRES_PASSWORD}" -lt 16 ]; then
  echo "POSTGRES_PASSWORD must contain at least 16 characters" >&2
  exit 1
fi

STORAGE_DRIVER="${STORAGE_DRIVER:-local}"
if [ "${STORAGE_DRIVER}" != "r2" ]; then
  echo "STORAGE_DRIVER must be r2 for production deployments" >&2
  exit 1
fi
for name in JWT_SECRET POSTGRES_PASSWORD LOCAL_UPLOAD_SECRET R2_ACCOUNT_ID \
  R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET R2_PUBLIC_BASE_URL \
  SMTP_HOST SMTP_FROM; do
  reject_placeholder "${name}"
done
case "${PUBLIC_APP_URL}" in https://*) ;; *) echo "PUBLIC_APP_URL must use https in production" >&2; exit 1 ;; esac
case "${API_PUBLIC_URL}" in https://*) ;; *) echo "API_PUBLIC_URL must use https in production" >&2; exit 1 ;; esac
case "${R2_PUBLIC_BASE_URL}" in https://*) ;; *) echo "R2_PUBLIC_BASE_URL must use https" >&2; exit 1 ;; esac

if [ -z "${GIT_REF:-}" ]; then
  GIT_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
fi
export GIT_REF

echo "==> Validating production Compose configuration"
docker compose -f docker-compose.yml config >/dev/null

echo "==> Building API image (ref: ${GIT_REF})"
previous_api_image_id="$(docker image inspect --format '{{.Id}}' "${API_IMAGE}" 2>/dev/null || true)"
docker build \
  --build-arg GIT_REF="${GIT_REF}" \
  -t "${API_IMAGE}" \
  -f ../apps/api/Dockerfile \
  ../apps/api

echo "==> Building backup image"
docker compose -f docker-compose.yml build backup

echo "==> Starting PostgreSQL for migration preflight"
docker compose -f docker-compose.yml up -d --wait postgres

compose_stderr="$(mktemp)"
trap 'rm -f "${compose_stderr}"' EXIT
if ! migration_state="$(docker compose -f docker-compose.yml exec -T postgres \
    psql -AtXqc "
      SELECT CASE
        WHEN to_regclass('public._prisma_migrations') IS NOT NULL THEN 'tracked'
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN 'legacy-or-unexpected'
        ELSE 'fresh'
      END;
    " "${POSTGRES_DB}" "${POSTGRES_USER}" 2>"${compose_stderr}")"; then
  cat "${compose_stderr}" >&2
  echo "Unable to determine migration state safely." >&2
  exit 1
fi

if [ -s "${compose_stderr}" ]; then
  cat "${compose_stderr}" >&2
fi

if [ "${migration_state}" = "legacy-or-unexpected" ]; then
  echo "The database has application tables but no Prisma migration history." >&2
  echo "Run the reviewed baseline procedure first: CONFIRM_LEGACY_BASELINE=I_UNDERSTAND bash ./baseline-existing-db.sh" >&2
  exit 1
fi
if [ "${migration_state}" != "fresh" ] && [ "${migration_state}" != "tracked" ]; then
  echo "Unable to determine migration state safely: ${migration_state}" >&2
  exit 1
fi
echo "Migration state: ${migration_state}"

if [ "${REQUIRE_PREDEPLOY_BACKUP:-true}" = "true" ]; then
  echo "==> Verifying pre-deploy PostgreSQL backup"
  docker compose -f docker-compose.yml run --rm --no-deps \
    --entrypoint /usr/local/bin/backup.sh backup
fi

echo "==> Applying Prisma schema"
docker compose -f docker-compose.yml run --rm migrate

echo "==> Restarting api + caddy + backup"
docker compose -f docker-compose.yml up -d --no-deps api caddy backup

echo "==> Done. Health check:"
sleep 5
if ! curl -fsS "https://${CADDY_PRIMARY_DOMAIN}/api/health/ready"; then
  echo "Health check failed, recent logs:"
  docker compose -f docker-compose.yml logs --tail=50 api
  if [ -n "${previous_api_image_id}" ]; then
    echo "==> Rolling back API image"
    docker tag "${previous_api_image_id}" "${API_IMAGE}"
    docker compose -f docker-compose.yml up -d --no-deps api
    sleep 5
    curl -fsS "https://${CADDY_PRIMARY_DOMAIN}/api/health/ready" || {
      echo "Rollback health check failed; inspect API and database immediately." >&2
      exit 1
    }
    echo "Rollback completed"
  else
    echo "No previous API image was available for rollback." >&2
  fi
  exit 1
fi
echo
echo "==> Pruning old images"
docker image prune -f
echo "OK"
