#!/bin/bash
set -euo pipefail

archive="${1:-}"
target_root="${2:-/opt/sutura}"

if [ -z "${archive}" ] || [ ! -f "${archive}" ]; then
  echo "Usage: $0 <release.tar.gz> [/opt/sutura]" >&2
  exit 1
fi
if [ "${target_root}" != "/opt/sutura" ]; then
  echo "Refusing an unexpected release target: ${target_root}" >&2
  exit 1
fi
if [ ! -f "${target_root}/infra/.env.production" ]; then
  echo "Missing ${target_root}/infra/.env.production; refusing to replace the release." >&2
  exit 1
fi

staging_dir="$(mktemp -d /tmp/sutura-release.XXXXXX)"
cleanup() { rm -rf -- "${staging_dir}"; }
trap cleanup EXIT

tar -xzf "${archive}" -C "${staging_dir}" --strip-components=1
for required in \
  apps/api/Dockerfile \
  apps/api/prisma/migrations/migration_lock.toml \
  infra/docker-compose.yml \
  infra/deploy.sh \
  infra/backup/restore.sh; do
  if [ ! -e "${staging_dir}/${required}" ]; then
    echo "Release archive is incomplete; missing ${required}" >&2
    exit 1
  fi
done

echo "Replacing source trees under ${target_root} (preserving infra/.env.production)"
mkdir -p "${target_root}/apps/api" "${target_root}/infra"
find "${target_root}/apps/api" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
find "${target_root}/infra" -mindepth 1 -maxdepth 1 ! -name '.env.production' -exec rm -rf -- {} +
cp -a "${staging_dir}/apps/api/." "${target_root}/apps/api/"
cp -a "${staging_dir}/infra/." "${target_root}/infra/"

echo "Release source trees installed. Production configuration was preserved."
