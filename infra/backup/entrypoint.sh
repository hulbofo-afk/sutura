#!/bin/bash
set -euo pipefail

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup scheduler started, target 03:00 UTC"

# BusyBox crond calls setpgid even with -f. That syscall is denied by the
# production container profile, which makes the container restart forever.
# Keep the scheduler as PID 1 instead; this needs no daemon privileges. The
# date guard makes the job idempotent for the container lifetime and catches
# up after a restart that happened after 03:00 UTC.
trap 'exit 0' TERM INT
last_run_date=""
while true; do
  now_date="$(date -u +%Y-%m-%d)"
  now_hm="$(date -u +%H%M)"
  if [ "${now_hm}" -ge 0300 ] && [ "${last_run_date}" != "${now_date}" ]; then
    if /usr/local/bin/backup.sh; then
      last_run_date="${now_date}"
    else
      echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] Backup failed; retrying later"
    fi
  fi
  sleep 30
done
