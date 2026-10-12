#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
tls_dir=.run/production/tls
mkdir -p "$tls_dir"
chmod 700 .run/production "$tls_dir"
if [[ -f "$tls_dir/server.crt" && -f "$tls_dir/server.key" && -f "$tls_dir/ca.crt" ]]; then
  openssl x509 -checkend 604800 -noout -in "$tls_dir/server.crt"
  exit 0
fi
if [[ ! -f "$tls_dir/ca.key" ]]; then
  openssl req -x509 -newkey rsa:3072 -nodes -keyout "$tls_dir/ca.key" -out "$tls_dir/ca.crt" -days 3650 -subj '/CN=Bastak School Local CA' >/dev/null 2>&1
fi
openssl req -newkey rsa:3072 -nodes -keyout "$tls_dir/server.key" -out "$tls_dir/server.csr" -subj '/CN=bastak-school.local' >/dev/null 2>&1
printf 'subjectAltName=IP:192.168.0.100,IP:192.168.0.107,DNS:bastak-school.local,DNS:localhost\nextendedKeyUsage=serverAuth\nkeyUsage=digitalSignature,keyEncipherment\n' > "$tls_dir/server.ext"
openssl x509 -req -in "$tls_dir/server.csr" -CA "$tls_dir/ca.crt" -CAkey "$tls_dir/ca.key" -CAcreateserial -out "$tls_dir/server.crt" -days 365 -extfile "$tls_dir/server.ext" >/dev/null 2>&1
chmod 600 "$tls_dir"/*.key
