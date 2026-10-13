#!/usr/bin/env bash
# Read-only HTTPS checks; never accepts an arbitrary remote endpoint or credentials.
set -euo pipefail
ca=${1:?CA certificate required}
port=${2:-443}
http_port=${3:-8082}
[[ "$port" =~ ^[0-9]+$ && "$http_port" =~ ^[0-9]+$ ]]
base="https://localhost:$port"
curl=(curl --fail --silent --show-error --connect-timeout 5 --max-time 15 --cacert "$ca")
"${curl[@]}" "$base/ready" | python3 -c 'import json,sys; assert json.load(sys.stdin)["ok"] is True'
"${curl[@]}" "$base/health" | python3 -c 'import json,sys; assert json.load(sys.stdin)["ok"] is True'
"${curl[@]}" "$base/" | python3 -c 'import sys; assert "<html" in sys.stdin.read().lower()'
"${curl[@]}" "$base/api/v2/openapi.json" | python3 -c 'import json,sys; assert "openapi" in json.load(sys.stdin)'
status=$(curl --silent --show-error --connect-timeout 5 --max-time 15 --cacert "$ca" -o /dev/null -w '%{http_code}' "$base/api/v2/me/context")
test "$status" = 401
test "$(curl --silent --show-error --connect-timeout 5 --max-time 15 -o /dev/null -w '%{http_code}' "http://localhost:$http_port/")" = 308
echo 'Read-only TLS, SPA, database readiness, API proxy and authentication probes passed.'
