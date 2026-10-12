#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
site=/etc/nginx/sites-available/bastak
[[ -f "$site" && -f /run/nginx.pid ]] || { echo 'Existing Bastak host Nginx site required.' >&2; exit 1; }
mkdir -p .run/production/backups
if [[ ! -f .run/production/backups/host-nginx-bastak.conf ]]; then cp "$site" .run/production/backups/host-nginx-bastak.conf; fi
# Validate the reviewed redirect-only site before changing the host site.
docker run --rm --entrypoint nginx --mount "type=bind,source=$PWD/deployment/lan/host-nginx.conf,target=/etc/nginx/conf.d/default.conf,readonly" nginx:1.30.5-alpine -t
# Docker administrator access writes only this authorized site. No privileged container or host filesystem mount.
docker run --rm --user 0 --cap-drop ALL --entrypoint sh --mount "type=bind,source=$PWD/deployment/lan/host-nginx.conf,target=/candidate,readonly" --mount "type=bind,source=$site,target=/host-site" nginx:1.30.5-alpine -c 'cat /candidate > /host-site'
if sudo -n nginx -t && sudo -n systemctl reload nginx; then
  [[ "$(curl --silent -o /dev/null -w '%{http_code}' http://127.0.0.1/)" = 308 ]] || { echo 'Host redirect verification failed.' >&2; exit 1; }
else
  echo 'Host site installed and container-validated. Reload requires host sudo access:' >&2
  echo 'sudo nginx -t && sudo systemctl reload nginx' >&2
  exit 1
fi
