#!/usr/bin/env bash
# Read-only production release evidence verifier. It never starts, stops, or
# recreates containers and never reads expanded environment-variable values.
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: verify-production-evidence.sh [--config-dir PATH] [--receipt PATH] [--data-volume NAME] [--project NAME]

Validates the persisted immutable-release receipt against currently running
containers. Configuration may also be supplied through PRODUCTION_CONFIG_DIR,
PRODUCTION_RECEIPT, PRODUCTION_DATA_VOLUME, and COMPOSE_PROJECT_NAME.
USAGE
}

config_dir=${PRODUCTION_CONFIG_DIR:-}
receipt=${PRODUCTION_RECEIPT:-}
data_volume=${PRODUCTION_DATA_VOLUME:-}
project=${COMPOSE_PROJECT_NAME:-bastak-school}

while (($#)); do
  case "$1" in
    --config-dir) config_dir=${2:?Configuration directory required}; shift 2 ;;
    --receipt) receipt=${2:?Release receipt required}; shift 2 ;;
    --data-volume) data_volume=${2:?Data volume required}; shift 2 ;;
    --project) project=${2:?Compose project required}; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
done

fail() {
  echo "Production evidence verification failed: $*" >&2
  exit 1
}

[[ "$config_dir" == /* ]] || fail 'an absolute production configuration directory is required'
[[ "$receipt" == /* ]] || fail 'an absolute release receipt path is required'
[[ "$data_volume" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]+$ ]] || fail 'an approved data-volume name is required'
[[ "$project" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]+$ ]] || fail 'an approved Compose project name is required'

for required in \
  "$config_dir/production.env" \
  "$config_dir/nginx.conf.template" \
  "$config_dir/tls/server.key" \
  "$config_dir/tls/server.crt" \
  "$config_dir/tls/ca.crt" \
  "$receipt"; do
  [[ -f "$required" ]] || fail "required persisted evidence is missing: $required"
done

for protected in "$receipt" "$config_dir/production.env" "$config_dir/tls/server.key"; do
  mode=$(stat -c '%a' "$protected")
  (( (8#$mode & 8#077) == 0 )) || fail "protected evidence has group or other permissions: $protected"
done

mapfile -t receipt_values < <(python3 - "$receipt" <<'PY'
import json
import re
import sys

try:
    receipt_path = sys.argv[1]
    receipt = json.load(open(receipt_path, encoding="utf-8"))
    sha = receipt["sha"]
    images = receipt["images"]
    backup = receipt["backup"]
    healthy_at = receipt["healthyAt"]
    if receipt.get("format") != 1 or receipt.get("source") != "Mobin-Karam/bastak-school":
        raise ValueError
    if not re.fullmatch(r"[a-f0-9]{40}", sha):
        raise ValueError
    if set(images) != {"backend-v2", "admin-v2"}:
        raise ValueError
    for service, image in images.items():
        if image.get("ref") != f"bastak-school/{service}:sha-{sha}":
            raise ValueError
        if not re.fullmatch(r"sha256:[a-f0-9]{64}", image.get("id", "")):
            raise ValueError
    if not isinstance(backup, str) or not backup.startswith("/") or not isinstance(healthy_at, str) or not healthy_at:
        raise ValueError
except Exception:
    print("Invalid immutable release receipt.", file=sys.stderr)
    raise SystemExit(1)

print(sha)
print(images["backend-v2"]["id"])
print(images["admin-v2"]["id"])
print(backup)
print(healthy_at)
PY
) || fail 'receipt cannot be read or does not have immutable-release provenance'

[[ ${#receipt_values[@]} -eq 5 ]] || fail 'receipt has incomplete immutable-release evidence'
release_sha=${receipt_values[0]}
backend_image=${receipt_values[1]}
admin_image=${receipt_values[2]}
backup_path=${receipt_values[3]}
healthy_at=${receipt_values[4]}

for backup_evidence in "$backup_path" "$backup_path.restored" "$backup_path.verification.json"; do
  [[ -f "$backup_evidence" ]] || fail "release backup evidence is missing: $backup_evidence"
  mode=$(stat -c '%a' "$backup_evidence")
  (( (8#$mode & 8#077) == 0 )) || fail "release backup evidence has group or other permissions: $backup_evidence"
done

container_for() {
  local service=$1
  mapfile -t containers < <(docker ps --quiet \
    --filter "label=com.docker.compose.project=$project" \
    --filter "label=com.docker.compose.service=$service")
  [[ ${#containers[@]} -eq 1 ]] || fail "expected exactly one running $service container for project $project"
  printf '%s\n' "${containers[0]}"
}

verify_container() {
  local service=$1 container=$2 expected_image=$3
  docker inspect "$container" | python3 -c '
import json
import sys

service, expected_image, release_sha, config_dir, data_volume = sys.argv[1:]
try:
    container = json.load(sys.stdin)[0]
    state = container["State"]
    if not state.get("Running") or state.get("Health", {}).get("Status") != "healthy":
        raise ValueError("container is not healthy")
    if container.get("Image") != expected_image:
        raise ValueError("running image digest differs from the receipt")
    labels = (container.get("Config", {}).get("Labels") or {})
    if labels.get("org.opencontainers.image.revision") != release_sha:
        raise ValueError("running image revision differs from the receipt")
    mounts = container.get("Mounts", [])
    if service == "backend-v2":
        expected = [("volume", data_volume, "/data")]
        actual = sorted((mount.get("Type"), mount.get("Name"), mount.get("Destination")) for mount in mounts)
        if actual != expected:
            raise ValueError("backend data-volume mount differs from the approved contract")
    else:
        expected = sorted([
            ("bind", config_dir + "/nginx.conf.template", "/etc/nginx/templates/default.conf.template"),
            ("bind", config_dir + "/tls", "/etc/nginx/tls"),
            ("bind", config_dir + "/tls/ca.crt", "/usr/share/nginx/html/bastak-school-ca.crt"),
        ])
        actual = sorted((mount.get("Type"), mount.get("Source"), mount.get("Destination")) for mount in mounts)
        if actual != expected:
            raise ValueError("admin configuration mounts differ from the approved host-owned contract")
except Exception as error:
    print(f"{service}: {error}", file=sys.stderr)
    raise SystemExit(1)
' "$service" "$expected_image" "$release_sha" "$config_dir" "$data_volume" || fail "container evidence is invalid for $service"
}

backend=$(container_for backend-v2)
admin=$(container_for admin-v2)
verify_container backend-v2 "$backend" "$backend_image"
verify_container admin-v2 "$admin" "$admin_image"

cat <<EOF
Production evidence verified (read-only):
  release SHA: $release_sha
  backend image: $backend_image
  admin image: $admin_image
  healthy receipt: $healthy_at
  backup evidence: $backup_path
  Compose project: $project
EOF
