#!/usr/bin/env bash
# Production entrypoint; this audit tests it only with disposable/fake resources.
set -euo pipefail
umask 077
cd "$(dirname "$0")/../.."
[[ "${IMMUTABLE_DEPLOY_ENABLED:-}" == true ]] || { echo 'Immutable deployment is not enabled.' >&2; exit 1; }
[[ "${RELEASE_SHA:-}" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid release SHA.' >&2; exit 1; }
: "${RELEASE_BUNDLE:?Verified release bundle required}"
: "${PRODUCTION_CONFIG_DIR:?Approved configuration required}"
: "${PRODUCTION_BACKUP_DIR:?Persistent backup directory required}"
: "${PRODUCTION_LOCK_FILE:?Persistent shared lock required}"
: "${PRODUCTION_RECEIPT:?Persistent receipt required}"
: "${PRODUCTION_DATA_VOLUME:?Existing database volume required}"
[[ "$PRODUCTION_DATA_VOLUME" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]+$ ]]
[[ "$PRODUCTION_CONFIG_DIR" == /* && "$PRODUCTION_BACKUP_DIR" == /* && "$RELEASE_BUNDLE" == /* && "$PRODUCTION_LOCK_FILE" == /* && "$PRODUCTION_RECEIPT" == /* ]]
test "$(git rev-parse HEAD)" = "$RELEASE_SHA" || { echo 'Checked-out source does not match the verified release SHA.' >&2; exit 1; }
for required in \
  "$PRODUCTION_CONFIG_DIR/production.env" \
  "$PRODUCTION_CONFIG_DIR/nginx.conf.template" \
  "$PRODUCTION_CONFIG_DIR/tls/server.key" \
  "$PRODUCTION_CONFIG_DIR/tls/server.crt" \
  "$PRODUCTION_CONFIG_DIR/tls/ca.crt"; do
  test -f "$required" || { echo "Required persistent production configuration is missing: $required" >&2; exit 1; }
done
for protected in "$PRODUCTION_CONFIG_DIR/production.env" "$PRODUCTION_CONFIG_DIR/tls/server.key"; do
  mode=$(stat -c '%a' "$protected")
  (( (8#$mode & 8#077) == 0 )) || { echo "Production secret has group or other permissions: $protected" >&2; exit 1; }
done
openssl x509 -checkend 604800 -noout -in "$PRODUCTION_CONFIG_DIR/tls/server.crt"

# Runtime configuration is host-owned. Deployments may read it, but must never
# create, remove, or rewrite any environment file in the protected directory.
environment_fingerprint() {
  find -L "$1" -type f \( -name ".env" -o -name ".env.*" -o -name "*.env" \) -print0 |
    LC_ALL=C sort -z |
    xargs -0r sha256sum |
    sha256sum |
    awk '{ print $1 }'
}
protected_environment_fingerprint=$(environment_fingerprint "$PRODUCTION_CONFIG_DIR")

exec 9>"$PRODUCTION_LOCK_FILE"
flock -n 9 || { echo 'Another deployment or recovery is running.' >&2; exit 1; }
python3 tooling/cicd/release_bundle.py load "$RELEASE_BUNDLE" "$RELEASE_SHA"
export BACKEND_IMAGE ADMIN_IMAGE
BACKEND_IMAGE=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["images"]["backend-v2"]["id"])' "$RELEASE_BUNDLE/loaded-images.json")
ADMIN_IMAGE=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["images"]["admin-v2"]["id"])' "$RELEASE_BUNDLE/loaded-images.json")
python3 - "$RELEASE_BUNDLE/loaded-images.json" "$RELEASE_SHA" "$BACKEND_IMAGE" "$ADMIN_IMAGE" <<'PY'
import json
import re
import sys

try:
    receipt = json.load(open(sys.argv[1], encoding="utf-8"))
    release_sha, backend_image, admin_image = sys.argv[2:]
    if receipt.get("format") != 1 or receipt.get("source") != "Mobin-Karam/bastak-school" or receipt.get("sha") != release_sha:
        raise ValueError
    images = receipt["images"]
    if set(images) != {"backend-v2", "admin-v2"}:
        raise ValueError
    for service, image in images.items():
        if image.get("ref") != f"bastak-school/{service}:sha-{release_sha}":
            raise ValueError
        if not re.fullmatch(r"sha256:[a-f0-9]{64}", image.get("id", "")):
            raise ValueError
    if images["backend-v2"]["id"] != backend_image or images["admin-v2"]["id"] != admin_image:
        raise ValueError
except Exception:
    print("Loaded release images do not match immutable provenance.", file=sys.stderr)
    raise SystemExit(1)
PY
docker image inspect "$BACKEND_IMAGE" "$ADMIN_IMAGE" >/dev/null
export PRODUCTION_CONFIG_DIR PRODUCTION_DATA_VOLUME RELEASE_SHA
compose=(docker compose --env-file "$PRODUCTION_CONFIG_DIR/production.env" -f docker-compose.production.yml -f deployment/lan/compose.yml -f deployment/lan/immutable.yml -p bastak-school)
"${compose[@]}" config --quiet
compose_config=$("${compose[@]}" config --format json)
COMPOSE_CONFIG="$compose_config" python3 - "$PRODUCTION_CONFIG_DIR" <<'PY'
import json
import os
import sys

try:
    config_dir = sys.argv[1]
    services = json.loads(os.environ["COMPOSE_CONFIG"])["services"]
    backend_mounts = services["backend-v2"].get("volumes", [])
    if not any(mount.get("type") == "volume" and mount.get("target") == "/data" for mount in backend_mounts):
        raise ValueError("backend data volume is not mounted at /data")
    expected_admin_mounts = sorted([
        ("bind", config_dir + "/nginx.conf.template", "/etc/nginx/templates/default.conf.template"),
        ("bind", config_dir + "/tls", "/etc/nginx/tls"),
        ("bind", config_dir + "/tls/ca.crt", "/usr/share/nginx/html/bastak-school-ca.crt"),
    ])
    actual_admin_mounts = sorted(
        (mount.get("type"), mount.get("source"), mount.get("target"))
        for mount in services["admin-v2"].get("volumes", [])
    )
    if actual_admin_mounts != expected_admin_mounts:
        raise ValueError("admin mounts are not the approved persistent configuration contract")
except Exception as error:
    print(f"Compose mount preflight failed: {error}", file=sys.stderr)
    raise SystemExit(1)
PY
backend=$("${compose[@]}" ps --status running -q backend-v2)
admin=$("${compose[@]}" ps --status running -q admin-v2)
[[ -n "$backend" && -n "$admin" ]] || { echo 'Expected existing running production stack; bootstrap is a separate operation.' >&2; exit 1; }
current_image=$(docker inspect --format '{{.Image}}' "$backend")
mount=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Name}}{{end}}{{end}}' "$backend")
[[ "$mount" == "$PRODUCTION_DATA_VOLUME" ]] || { echo 'Existing volume identity mismatch.' >&2; exit 1; }
docker volume inspect "$PRODUCTION_DATA_VOLUME" >/dev/null
mkdir -p "$PRODUCTION_BACKUP_DIR"
chmod 700 "$PRODUCTION_BACKUP_DIR"
backup_name="$(date -u +%Y%m%dT%H%M%SZ)-$RELEASE_SHA-$$.sqlite"
backup_path="$PRODUCTION_BACKUP_DIR/$backup_name"
stopped=false
replacement_started=false
cleanup() {
  status=$?
  trap - EXIT
  if (( status != 0 )) && [[ "$stopped" == true ]]; then
    if [[ "$replacement_started" == false ]]; then
      # Existing containers retain their exact old configuration/images.
      docker start "$backend" "$admin" >/dev/null || true
      echo 'Preflight failed; existing containers restarted. Verify readiness.' >&2
    else
      "${compose[@]}" stop admin-v2 >/dev/null || true
      echo 'Replacement failed after possible live migrations; ingress stopped. Preserve backup and follow incident recovery.' >&2
    fi
  fi
  exit "$status"
}
trap cleanup EXIT
stopped=true
"${compose[@]}" stop -t 30 admin-v2 backend-v2
# Only the OLD runtime reads live storage; candidate migrations get a restored COPY.
# SQLite migration work gets bounded temp storage without making the image writable.
docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --user "$(id -u):$(id -g)" \
  --mount "type=volume,src=$PRODUCTION_DATA_VOLUME,dst=/data,readonly" \
  --mount "type=bind,src=$PRODUCTION_BACKUP_DIR,dst=/backup" \
  "$current_image" node - backup /data/moshaver-v2.sqlite "/backup/$backup_name" < scripts/deploy/database-recovery.cjs
chmod 600 "$backup_path" "$backup_path.restored" "$backup_path.verification.json"
docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --user "$(id -u):$(id -g)" \
  --mount "type=bind,src=$PRODUCTION_BACKUP_DIR,dst=/backup" \
  -e "DATABASE_PATH=/backup/$backup_name.restored" -e NODE_ENV=test \
  "$BACKEND_IMAGE" node - rehearse "/backup/$backup_name" "/backup/$backup_name.restored" < scripts/deploy/database-recovery.cjs
replacement_started=true
"${compose[@]}" up -d --no-build --pull never --force-recreate --wait --wait-timeout 180
for service in backend-v2 admin-v2; do
  container=$("${compose[@]}" ps -q "$service")
  actual=$(docker inspect --format '{{.Image}}' "$container")
  expected=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["images"][sys.argv[2]]["id"])' "$RELEASE_BUNDLE/loaded-images.json" "$service")
  [[ "$actual" == "$expected" ]] || { echo 'Running image identity mismatch.' >&2; exit 1; }
done
"${compose[@]}" exec -T admin-v2 nginx -t
./scripts/deploy/probe-release.sh "$PRODUCTION_CONFIG_DIR/tls/ca.crt"
[[ "$protected_environment_fingerprint" == "$(environment_fingerprint "$PRODUCTION_CONFIG_DIR")" ]] || {
  echo 'Protected production environment files changed during deployment; refusing release receipt.' >&2
  exit 1
}
python3 - "$RELEASE_BUNDLE/loaded-images.json" "$PRODUCTION_RECEIPT" "$backup_path" <<'PY'
import json,sys,os,datetime
manifest=json.load(open(sys.argv[1]))
manifest.update(backup=sys.argv[3], healthyAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
temporary=sys.argv[2]+'.pending'
with open(temporary,'w') as out: json.dump(manifest,out); out.write('\n')
os.chmod(temporary,0o600)
os.replace(temporary,sys.argv[2])
PY
echo 'Immutable release healthy; receipt saved. Retain backup and both release bundles.'
