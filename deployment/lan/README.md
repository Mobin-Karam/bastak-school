# Bastak LAN production

The current product serves staff and student accounts from `apps/admin` and the `/api/v2` modular-monolith API. The former `apps/student` project is absent from this checkout and is not a deployable service.

## Access

- `https://192.168.0.100`
- `https://192.168.0.107` after the router assigns that address to this server.

The frontend uses `/api/v2` on its current origin. Cookies remain Secure and HttpOnly; CORS accepts both HTTPS IP origins. Both addresses are certificate SANs. Bindings listen on all host interfaces. This does not assign an IP or reserve a DHCP lease: reserve either address for the server in each router, and avoid IP conflicts. `.107` was not assigned during deployment; its TLS and proxy handling were tested using a connection override to `.100`.

Install the public certificate `.run/production/tls/ca.crt` as a trusted CA on each client device. The same public certificate is available at `/bastak-school-ca.crt`. Transfer it from this server through a trusted channel. Private keys stay local and must never be shared. HTTPS is needed for production secure cookies and installation as a PWA.

## Deploy and update

Requires Docker Engine, Compose 2.24.4 or newer (`!override`), OpenSSL, curl, and Bash. No root npm installation is used.

```bash
./scripts/deploy/create-lan-tls.sh
cp deployment/lan/production.env.example .run/production/production.env
./scripts/deploy/lan.sh
```

`lan.sh` builds before replacing services, takes a consistent SQLite backup on updates, starts health-gated services, and checks HTTPS readiness. It never seeds production or deletes its volume. The API is private except loopback `127.0.0.1:4001`; Nginx publishes port 443 and loopback port 8082 for HTTP redirect checks. The pre-existing host Nginx on port 80 returns HTTP 308 redirects to HTTPS. Its reviewed site is `deployment/lan/host-nginx.conf`; `scripts/deploy/install-host-nginx.sh` validates and installs it. Reloading the host service requires sudo (`sudo nginx -t && sudo systemctl reload nginx`). The static redirect page is a fallback for older host configurations.

The application images pin Node 22.23.3 and Nginx 1.30.5; Nginx version selection follows the [official stable release](https://nginx.org/en/download.html).

TLS secrets and environment files live in ignored `.run/production`. The persistent database volume is `bastak-school_moshaver_v2_sqlite`. Keep a separate off-host copy of database backups and the CA key. A certificate lasts one year; remove only `server.crt` and rerun the TLS script to renew with the same CA. Do not regenerate the CA on normal updates.

```bash
docker compose --env-file .run/production/production.env -f docker-compose.production.yml -f deployment/lan/compose.yml ps
curl --cacert .run/production/tls/ca.crt https://192.168.0.100/ready
```

## CI and CD

Existing API and Admin quality workflows run lint/type checks, tests and production builds. Deployment Readiness builds these exact images, migrates a disposable database, and checks HTTPS, proxies and cookie configuration. The disposable CI project has its own volume; only that CI volume is removed by its cleanup.

`LAN Production Deployment` is a manual main-branch workflow using a self-hosted Linux x64 runner labeled `bastak-lan` and the `lan-production` GitHub environment. Register the runner before using remote CD. Store this server's `tls` directory and `production.env` in `/home/bastak-server/.config/bastak-production` for the runner. The workflow does not carry certificates or credentials in Git. Configure environment protection and repository access deliberately. Runner registration and GitHub environment configuration are external setup, not completed by local Docker deployment.

For rollback, keep the previous image IDs before rebuilding and restore their tags, then run Compose `up -d --wait` without rebuilding. Application rollback preserves the database. Restore a database backup only with both services stopped and after reviewing writes since the backup. Never use `down --volumes` in production.

## Dorm-wide attendance

The supervisor selects one active student resident and an inclusive night/date range in the dorm attendance tab. Saving replaces the current responsibility for every active room of that student's school in one transaction. Each room retains its own roster, revision and session. New rooms require assigning again. A later room-specific responsibility overrides that room only. Delegation never changes the student's role or grants staff attendance history. A delegated student must remain an active school member and a resident of an active school dorm room.

## Reference

- [Docker readiness dependencies](https://docs.docker.com/compose/how-tos/startup-order/)
- [Nginx streaming proxy behavior](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_buffering)

The parity audit counts current canonical workflows. `/archive/dashboard` is explicitly a legacy controller; current dashboard projections replace it. Student enrollment lookup is a student workflow. Student profile aliases use the existing student editor, while attendance profile access uses the stricter staff endpoint. Registration contacts/section updates and document verification remain deferred with the existing coming-soon registration UI. The legacy request-letter endpoints are preserved for API compatibility; the current permission-request workflow owns staff requests. These exact exceptions do not exempt new backend routes.
