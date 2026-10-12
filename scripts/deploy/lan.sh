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
"${compose[@]}" config --quiet
# Builds complete before replacing the running release. No seed/reset or volume deletion.
"${compose[@]}" build
if "${compose[@]}" ps --status running --services | grep -qx backend-v2; then
  mkdir -p "$backup_dir"
  chmod 700 "$backup_dir"
  "${compose[@]}" exec -T backend-v2 node -e 'const Database=require("better-sqlite3");new Database(process.env.DATABASE_PATH).backup("/data/pre-deploy.sqlite").then(()=>process.exit(0)).catch(()=>process.exit(1));'
  backup_file="$backup_dir/$(date -u +%Y%m%dT%H%M%SZ)-${RELEASE_SHA:-manual}.sqlite"
  "${compose[@]}" cp backend-v2:/data/pre-deploy.sqlite "$backup_file"
  chmod 600 "$backup_file"
fi
"${compose[@]}" up -d --force-recreate --wait --wait-timeout 180
curl --fail --silent --show-error --cacert .run/production/tls/ca.crt https://localhost/ready

if [[ -w /var/www/bastak-admin ]]; then
  mkdir -p "$backup_dir"
  chmod 700 "$backup_dir"
  if [[ ! -f "$backup_dir/http-index.html" && -f /var/www/bastak-admin/index.html ]]; then cp /var/www/bastak-admin/index.html "$backup_dir/http-index.html"; fi
  install -m 644 deployment/lan/http-redirect.html /var/www/bastak-admin/index.html
  install -m 644 .run/production/tls/ca.crt /var/www/bastak-admin/bastak-school-ca.crt
fi
