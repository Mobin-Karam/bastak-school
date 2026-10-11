#!/usr/bin/env bash
# Disposable fixtures only; never uses production configuration or its database.
set -euo pipefail
cd "$(dirname "$0")/../.."
security_directory=$(mktemp -d)
security_pid=''
cleanup() {
  if [[ -n "$security_pid" ]]; then kill "$security_pid" 2>/dev/null || true; wait "$security_pid" 2>/dev/null || true; fi
  rm -rf "$security_directory"
}
trap cleanup EXIT
security_port=${E2E_SECURITY_PORT:-4002}
if curl --silent --fail "http://127.0.0.1:$security_port/ready" >/dev/null; then
  echo "Security test port $security_port is already occupied." >&2
  exit 1
fi
NODE_ENV=test ALLOW_E2E_SEED=true DATABASE_PATH="$security_directory/security.sqlite" node apps/api/dist/database/seeds/security-matrix.js > "$security_directory/seed.log" 2>&1
NODE_ENV=test DATABASE_PATH="$security_directory/security.sqlite" PORT="$security_port" COOKIE_SECURE=0 node apps/api/dist/main.js > "$security_directory/api.log" 2>&1 &
security_pid=$!
for attempt in {1..40}; do
  kill -0 "$security_pid" 2>/dev/null || { echo 'Disposable security API failed to start.' >&2; exit 1; }
  if curl --silent --fail "http://127.0.0.1:$security_port/ready" >/dev/null; then break; fi
  sleep 1
done
curl --silent --fail "http://127.0.0.1:$security_port/ready" >/dev/null
E2E_API_URL="http://127.0.0.1:$security_port/api/v2" node apps/api/scripts/security-matrix-e2e.mjs
