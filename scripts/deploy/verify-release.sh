#!/usr/bin/env bash
# Build/test disposable release images; never references configured production data.
set -euo pipefail
umask 077
cd "$(dirname "$0")/../.."
export RELEASE_SHA=${RELEASE_SHA:-$(git rev-parse HEAD)}
[[ "$RELEASE_SHA" =~ ^[a-f0-9]{40}$ ]]
export BACKEND_IMAGE="bastak-school/backend-v2:sha-$RELEASE_SHA"
export ADMIN_IMAGE="bastak-school/admin-v2:sha-$RELEASE_SHA"
test_directory=$(mktemp -d)
export CI_TLS_DIR="$test_directory/tls"
export CI_HTTPS_PORT=${CI_HTTPS_PORT:-9443}
export CI_HTTP_PORT=${CI_HTTP_PORT:-9082}
compose=(docker compose --env-file deployment/lan/production.env.example -f docker-compose.production.yml -f deployment/lan/compose.yml -f deployment/lan/ci.yml -p "bastak-ci-$$")
cleanup() {
  status=$?
  trap - EXIT
  if (( status != 0 )); then "${compose[@]}" ps; "${compose[@]}" logs --no-color --tail 80; fi
  "${compose[@]}" down --volumes --remove-orphans
  rm -rf "$test_directory"
  exit "$status"
}
trap cleanup EXIT
TLS_DIRECTORY="$CI_TLS_DIR" ./scripts/deploy/create-lan-tls.sh
"${compose[@]}" config --quiet
"${compose[@]}" build
# Exercise the same content-ID selection used by production, not tag lookup alone.
BACKEND_IMAGE=$(docker image inspect --format '{{.Id}}' "$BACKEND_IMAGE")
ADMIN_IMAGE=$(docker image inspect --format '{{.Id}}' "$ADMIN_IMAGE")
# Do this before candidate startup: starting the candidate on the disposable
# compose volume would apply every migration and hide old-to-new failures.
# A named volume inherits /data ownership (image UID 1000), which differs
# from hosted runner UIDs. A private bind directory belongs to the invoking UID.
mkdir "$test_directory/upgrade-data"
docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
  --user "$(id -u):$(id -g)" --mount "type=bind,src=$test_directory/upgrade-data,dst=/data" \
  -e DATABASE_PATH=/data/moshaver-v2.sqlite -e NODE_ENV=test \
  "$BACKEND_IMAGE" node - < scripts/deploy/prepare-upgrade-rehearsal.cjs
mkdir "$test_directory/upgrade-backup"
docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
  --user "$(id -u):$(id -g)" --mount "type=bind,src=$test_directory/upgrade-data,dst=/data,readonly" \
  --mount "type=bind,src=$test_directory/upgrade-backup,dst=/backup" \
  "$BACKEND_IMAGE" node - backup /data/moshaver-v2.sqlite /backup/snapshot.sqlite < scripts/deploy/database-recovery.cjs
docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
  --user "$(id -u):$(id -g)" --mount "type=bind,src=$test_directory/upgrade-backup,dst=/backup" \
  -e DATABASE_PATH=/backup/snapshot.sqlite.restored -e NODE_ENV=test \
  "$BACKEND_IMAGE" node - rehearse /backup/snapshot.sqlite /backup/snapshot.sqlite.restored < scripts/deploy/database-recovery.cjs
"${compose[@]}" up -d --no-build --pull never --wait --wait-timeout 180
./scripts/deploy/probe-release.sh "$CI_TLS_DIR/ca.crt" "$CI_HTTPS_PORT" "$CI_HTTP_PORT"
"${compose[@]}" exec -T admin-v2 nginx -t
"${compose[@]}" exec -T backend-v2 node -e 'if(process.env.COOKIE_SECURE!=="1"||process.env.NODE_ENV!=="production")process.exit(1)'
"${compose[@]}" exec -T -e NODE_ENV=test -e ALLOW_E2E_SEED=true backend-v2 node dist/database/seeds/security-matrix.js
NODE_EXTRA_CA_CERTS="$CI_TLS_DIR/ca.crt" SMOKE_ALLOW_DISPOSABLE_WRITES=true SMOKE_BASE_URL="https://localhost:$CI_HTTPS_PORT/api/v2" node scripts/deploy/smoke-critical.mjs
"${compose[@]}" stop -t 30 backend-v2
data_volume=$(docker volume ls --filter "label=com.docker.compose.project=bastak-ci-$$" --filter label=com.docker.compose.volume=moshaver_v2_sqlite --format '{{.Name}}')
[[ "$data_volume" == "bastak-ci-$$"* ]]
mkdir "$test_directory/backup"
docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
  --user "$(id -u):$(id -g)" --mount "type=volume,src=$data_volume,dst=/data,readonly" \
  --mount "type=bind,src=$test_directory/backup,dst=/backup" \
  "$BACKEND_IMAGE" node - backup /data/moshaver-v2.sqlite /backup/snapshot.sqlite < scripts/deploy/database-recovery.cjs
docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
  --user "$(id -u):$(id -g)" --mount "type=bind,src=$test_directory/backup,dst=/backup" \
  -e DATABASE_PATH=/backup/snapshot.sqlite.restored -e NODE_ENV=test \
  "$BACKEND_IMAGE" node - rehearse /backup/snapshot.sqlite /backup/snapshot.sqlite.restored < scripts/deploy/database-recovery.cjs
if [[ -n "${CI_RELEASE_BUNDLE:-}" ]]; then
  python3 tooling/cicd/release_bundle.py create "$CI_RELEASE_BUNDLE" "$RELEASE_SHA"
  python3 tooling/cicd/release_bundle.py verify "$CI_RELEASE_BUNDLE" "$RELEASE_SHA"
fi
echo 'Disposable release images, HTTPS critical workflows and restore rehearsal passed.'
