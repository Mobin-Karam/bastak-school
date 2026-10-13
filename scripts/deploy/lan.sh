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
if "${compose[@]}" ps --status running --services | grep -qx backend-v2; then
  mkdir -p "$backup_dir"
  chmod 700 "$backup_dir"
  "${compose[@]}" exec -T backend-v2 node -e 'const Database=require("better-sqlite3");new Database(process.env.DATABASE_PATH).backup("/data/pre-deploy.sqlite").then(()=>process.exit(0)).catch(()=>process.exit(1));'
  backup_file="$backup_dir/$(date -u +%Y%m%dT%H%M%SZ)-${RELEASE_SHA:-manual}.sqlite"
  "${compose[@]}" cp backend-v2:/data/pre-deploy.sqlite "$backup_file"
  chmod 600 "$backup_file"
  # Verify an actual restoration and rehearse the candidate migration chain on
  # that isolated copy before any candidate can touch the persistent volume.
  previous_image=$(docker inspect "$("${compose[@]}" ps -q backend-v2)" --format '{{.Image}}')
  backup_path=$(realpath "$backup_dir")
  backup_name=$(basename "$backup_file")
  recovery_script=$(realpath scripts/deploy/database-recovery.cjs)
  docker run --rm --network none \
    --mount "type=bind,src=$backup_path,dst=/backup" \
    --mount "type=bind,src=$recovery_script,dst=/tmp/database-recovery.cjs,readonly" \
    --entrypoint node "$previous_image" -e \
    'const D=require("better-sqlite3"),fs=require("node:fs");const src=process.argv[1],dst=src+".restored";if(fs.existsSync(dst))process.exit(1);const db=new D(src,{readonly:true,fileMustExist:true});db.backup(dst).then(()=>{db.close();fs.chmodSync(dst,0o600);process.argv=["node","/tmp/database-recovery.cjs","verify",src,dst];require("/tmp/database-recovery.cjs");}).catch(()=>process.exit(1));' \
    "/backup/$backup_name"
  candidate_image=$BACKEND_IMAGE
  docker run --rm --network none \
    --mount "type=bind,src=$backup_path,dst=/backup" \
    --mount "type=bind,src=$recovery_script,dst=/tmp/database-recovery.cjs,readonly" \
    --env "DATABASE_PATH=/backup/$backup_name.restored" \
    --entrypoint node "$candidate_image" /tmp/database-recovery.cjs rehearse \
    "/backup/$backup_name" "/backup/$backup_name.restored"
fi
"${compose[@]}" up -d --force-recreate --wait --wait-timeout 180
for service in backend-v2 admin-v2; do
  if [[ "$service" == backend-v2 ]]; then expected_tag=$BACKEND_IMAGE; else expected_tag=$ADMIN_IMAGE; fi
  expected_id=$(docker image inspect "$expected_tag" --format '{{.Id}}')
  container=$("${compose[@]}" ps -q "$service")
  [[ "$(docker inspect "$container" --format '{{.Image}}')" == "$expected_id" ]] || { echo 'Running image identity mismatch.' >&2; exit 1; }
  [[ "$(docker image inspect "$expected_tag" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" == "$RELEASE_SHA" ]] || { echo 'Running revision mismatch.' >&2; exit 1; }
done
curl --fail --silent --show-error --cacert .run/production/tls/ca.crt https://localhost/ready

if [[ -w /var/www/bastak-admin ]]; then
  mkdir -p "$backup_dir"
  chmod 700 "$backup_dir"
  if [[ ! -f "$backup_dir/http-index.html" && -f /var/www/bastak-admin/index.html ]]; then cp /var/www/bastak-admin/index.html "$backup_dir/http-index.html"; fi
  install -m 644 deployment/lan/http-redirect.html /var/www/bastak-admin/index.html
  install -m 644 .run/production/tls/ca.crt /var/www/bastak-admin/bastak-school-ca.crt
fi
