#!/usr/bin/env bash
set -euo pipefail
umask 077
cd "$(dirname "$0")/../.."
mkdir -p .run
lock_file=${PRODUCTION_LOCK_FILE:-${XDG_CONFIG_HOME:-$HOME/.config}/bastak-production/deploy.lock}
[[ -d "$(dirname "$lock_file")" ]] || { echo 'Configure persistent production lock directory before deployment.' >&2; exit 1; }
exec 9>"$lock_file"
flock -n 9 || { echo 'Another deployment is running.' >&2; exit 1; }
./scripts/deploy/create-lan-tls.sh
[[ -f .run/production/production.env ]] || { echo 'Create .run/production/production.env from deployment/lan/production.env.example.' >&2; exit 1; }

# Local/LAN production configuration is host-owned and must survive releases
# byte-for-byte. Detect accidental writes before declaring the new stack healthy.
environment_fingerprint() {
  find -L "$1" -type f \( -name ".env" -o -name ".env.*" -o -name "*.env" \) -print0 |
    LC_ALL=C sort -z |
    xargs -0r sha256sum |
    sha256sum |
    awk '{ print $1 }'
}
protected_environment_fingerprint=$(environment_fingerprint .run/production)

backup_dir=${PRODUCTION_BACKUP_DIR:-.run/production/backups}
compose=(docker compose --env-file .run/production/production.env -f docker-compose.production.yml -f deployment/lan/compose.yml)
release_sha=${RELEASE_SHA:-$(git rev-parse HEAD)}
[[ "$release_sha" =~ ^[a-f0-9]{40}$ ]] || { echo 'A full release commit is required.' >&2; exit 1; }
export RELEASE_SHA="$release_sha"
export BACKEND_IMAGE="bastak-school/backend-v2:$release_sha"
export ADMIN_IMAGE="bastak-school/admin-v2:$release_sha"
"${compose[@]}" config --quiet
# Builds complete before replacing the running release. No seed/reset or volume deletion.
if "${compose[@]}" ps --status running --services | grep -qx backend-v2; then
  python3 scripts/deploy/retain-current-images.py
fi
"${compose[@]}" build
stopped=false
replacement_started=false
previous_backend=''
previous_admin=''
cleanup() {
  status=$?
  trap - EXIT
  if (( status != 0 )) && [[ "$stopped" == true ]]; then
    if [[ "$replacement_started" == false ]]; then
      docker start "$previous_backend" "$previous_admin" >/dev/null || true
      echo 'Preflight failed; previous containers restarted. Verify readiness.' >&2
    else
      "${compose[@]}" stop admin-v2 >/dev/null 2>&1 || true
      echo 'Candidate failed after replacement; ingress stopped. Assess migration/backup compatibility before rollback.' >&2
    fi
  fi
  exit "$status"
}
trap cleanup EXIT
if "${compose[@]}" ps --status running --services | grep -qx backend-v2; then
  mkdir -p "$backup_dir"
  chmod 700 "$backup_dir"
  previous_backend=$("${compose[@]}" ps -q backend-v2)
  previous_admin=$("${compose[@]}" ps -q admin-v2)
  [[ -n "$previous_backend" && -n "$previous_admin" ]] || { echo 'Expected an existing production stack.' >&2; exit 1; }
  previous_image=$(docker inspect "$previous_backend" --format '{{.Image}}')
  volume=$(docker inspect "$previous_backend" --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}')
  [[ "$volume" == "${PRODUCTION_DATA_VOLUME:-bastak-school_moshaver_v2_sqlite}" ]] || { echo 'Production database volume mismatch.' >&2; exit 1; }
  backup_file="$backup_dir/$(date -u +%Y%m%dT%H%M%SZ)-${RELEASE_SHA:-manual}.sqlite"
  # Verify an actual restoration and rehearse the candidate migration chain on
  # the final stopped writer's copy before touching the persistent database.
  backup_path=$(realpath "$backup_dir")
  backup_name=$(basename "$backup_file")
  recovery_script=$(realpath scripts/deploy/database-recovery.cjs)
  stopped=true
  "${compose[@]}" stop admin-v2 backend-v2
  docker run --rm --network none \
    --mount "type=volume,src=$volume,dst=/data,readonly" \
    --mount "type=bind,src=$backup_path,dst=/backup" \
    --mount "type=bind,src=$recovery_script,dst=/tmp/database-recovery.cjs,readonly" \
    --entrypoint node "$previous_image" /tmp/database-recovery.cjs backup /data/moshaver-v2.sqlite \
    "/backup/$backup_name"
  chmod 600 "$backup_file"
  candidate_image=$BACKEND_IMAGE
  docker run --rm --network none \
    --mount "type=bind,src=$backup_path,dst=/backup" \
    --mount "type=bind,src=$recovery_script,dst=/tmp/database-recovery.cjs,readonly" \
    --env "DATABASE_PATH=/backup/$backup_name.restored" \
    --env "NODE_ENV=test" \
    --entrypoint node "$candidate_image" /tmp/database-recovery.cjs rehearse \
    "/backup/$backup_name" "/backup/$backup_name.restored"
fi
replacement_started=true
"${compose[@]}" up -d --force-recreate --wait --wait-timeout 180
for service in backend-v2 admin-v2; do
  if [[ "$service" == backend-v2 ]]; then expected_tag=$BACKEND_IMAGE; else expected_tag=$ADMIN_IMAGE; fi
  expected_id=$(docker image inspect "$expected_tag" --format '{{.Id}}')
  container=$("${compose[@]}" ps -q "$service")
  [[ "$(docker inspect "$container" --format '{{.Image}}')" == "$expected_id" ]] || { echo 'Running image identity mismatch.' >&2; exit 1; }
  [[ "$(docker image inspect "$expected_tag" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" == "$RELEASE_SHA" ]] || { echo 'Running revision mismatch.' >&2; exit 1; }
done
curl --fail --silent --show-error --cacert .run/production/tls/ca.crt https://localhost/ready
[[ "$protected_environment_fingerprint" == "$(environment_fingerprint .run/production)" ]] || {
  echo 'Protected production environment files changed during deployment; refusing completion.' >&2
  exit 1
}

if [[ -w /var/www/bastak-admin ]]; then
  mkdir -p "$backup_dir"
  chmod 700 "$backup_dir"
  if [[ ! -f "$backup_dir/http-index.html" && -f /var/www/bastak-admin/index.html ]]; then cp /var/www/bastak-admin/index.html "$backup_dir/http-index.html"; fi
  install -m 644 deployment/lan/http-redirect.html /var/www/bastak-admin/index.html
  install -m 644 .run/production/tls/ca.crt /var/www/bastak-admin/bastak-school-ca.crt
fi
