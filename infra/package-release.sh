#!/bin/bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "${repo_root}"

if [ -n "$(git status --porcelain --untracked-files=all)" ]; then
  echo "Working tree is not clean; commit the validated release before packaging." >&2
  exit 1
fi

tracked_release_secrets="$(git ls-files apps/api infra | rg '(^|/)\.env($|\.)' | rg -v '\.env\.example$' || true)"
if [ -n "${tracked_release_secrets}" ]; then
  echo "Refusing to package tracked non-example environment files:" >&2
  echo "${tracked_release_secrets}" >&2
  exit 1
fi

required_files=(
  apps/api/Dockerfile
  apps/api/prisma/migrations/migration_lock.toml
  apps/api/prisma/migrations/20260803000000_init/migration.sql
  apps/api/prisma/migrations/20260803000001_align_current_mvp/migration.sql
  infra/deploy.sh
  infra/baseline-existing-db.sh
  infra/install-archive-release.sh
  infra/.env.production.example
  infra/docker-compose.yml
  infra/caddy/Caddyfile
  infra/backup/Dockerfile
  infra/backup/backup.sh
  infra/backup/restore.sh
  infra/backup/entrypoint.sh
)
for file in "${required_files[@]}"; do
  git ls-files --error-unmatch "${file}" >/dev/null || {
    echo "Required release file is not tracked: ${file}" >&2
    exit 1
  }
done

ref="$(git rev-parse --short HEAD)"
output="${1:-/tmp/sutura-release-${ref}.tar.gz}"
git archive --format=tar.gz --prefix=sutura/ --output="${output}" HEAD apps/api infra
echo "${output}"
