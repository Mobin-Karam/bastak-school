# Multi-domain browser topology

## Purpose

One compiled React/Vite application in `apps/admin` serves two browser
experiences at runtime. No `apps/student` application is built or deployed.

| Hostname          | Experience                             | Upstream (operator-reported production topology) |
| ----------------- | -------------------------------------- | ------------------------------------------------ |
| `app.sultano.ir`  | capability-aware school staff platform | `127.0.0.1:8082`                                 |
| `stud.sultano.ir` | student-only portal                    | `127.0.0.1:8082`                                 |
| `api.sultano.ir`  | independent NestJS/Fastify API         | `127.0.0.1:4001`                                 |

The host-side ports are not container ports. The checked-in LAN overlay maps
the frontend container's port 80 to `127.0.0.1:8082`, maps the API container's
port 4000 to `127.0.0.1:4001`, and lets the frontend container own port 443.
Do not introduce a second Nginx listener on 443 without first changing that
topology deliberately.

## Runtime routing

`apps/admin/src/app/routing/portal-domain.ts` is the single domain resolver.
It uses exact hostname matching:

- `stud.sultano.ir` and `stud.localhost` select the student portal.
- `app.sultano.ir` and `app.localhost` select the staff portal.
- `localhost`, `127.0.0.1`, and `::1` retain local development behavior.
- Every other host is unsupported and never falls back to the staff portal.

The route boundary runs after authentication restores the server-provided
account context. It restricts the student hostname to explicitly approved
student paths: home, weekly schedule, personal attendance, textbooks, leave
and temporary-exit requests, profile, account settings, mobile `more`, and
notifications. It does not grant access based on the host. The shared router
still lazy-loads route modules, and
`CapabilityRoute` only controls UI access. NestJS role, capability,
organization, and relationship checks remain authoritative for every API call.

The login endpoint rejects a student/guardian-only account on the staff host
and a staff account on the student host before it creates a session. The error
names the correct portal URL. An account that has any staff role is a staff
account for this decision; a student and guardian-only account belongs to the
student portal. Cross-host destinations are allowlisted by the same resolver;
arbitrary `redirect` query values are not used.

## Authentication, API, and security

The browser client uses `VITE_API_URL` and includes credentials. Production
Docker builds default it to `https://api.sultano.ir`; local development keeps
the `/api/v2` Vite proxy. The API prefix is `/api/v2`; health endpoints are
intentionally unprefixed at `/health` and `/ready`.

The API uses HttpOnly access and refresh cookies plus a session-bound CSRF
token for mutations. Keep `COOKIE_DOMAIN` empty for host-only cookies on
`api.sultano.ir` unless a reviewed parent-domain-cookie requirement exists.
Configure `CORS_ORIGINS` with exactly:

```dotenv
CORS_ORIGINS=https://app.sultano.ir,https://stud.sultano.ir
COOKIE_SECURE=1
COOKIE_SAMESITE=lax
```

CORS is only a browser response policy; it does not authorize clients.
Unapproved origins receive no credentialed CORS grant, while native and
server-side clients remain subject to normal authentication and authorization.

## Build and edge requirements

Build one artifact only:

```bash
npm --prefix apps/admin run build
```

Use the tracked `apps/admin/vite.config.ts`; an ignored `vite.config.js` may
exist locally but is not source configuration. The frontend Nginx template
keeps SPA history fallback and serves the PWA manifest and service worker
without cache fallback. Configure both browser hostnames to the same frontend
image/container and route `api.sultano.ir` only to the backend. Preserve
forwarded-host/proto/IP headers and proxy buffering settings for API/SSE.

The live Nginx virtual-host, DNS, and TLS configuration is not in this
repository. Validate it on the deployment host before changing it; do not
assume a host Nginx can bind 443 while the frontend container owns that port.

The Coolify descriptor follows the same single-image rule: attach both browser
domains to `admin-v2` and attach `api.sultano.ir` to `backend-v2`. It does not
define a separate Student build.

## Production configuration and troubleshooting

`docker-compose.coolify.yml` deliberately has no public host-port bindings: the
deployment platform owns that concern. The checked-in LAN overlay instead adds
`127.0.0.1:8082:80`, `127.0.0.1:4001:4000`, and its existing public 443
binding. Use the overlay only when that documented LAN topology is the target;
do not copy its 443 binding into an already-running public host configuration.

The backend reads `CORS_ORIGINS`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, and
`TRUST_PROXY`. `VITE_API_URL` is a build argument for the single frontend
image, not a browser runtime setting. The checked-in production image uses
`https://api.sultano.ir`; local development retains the same-origin `/api/v2`
proxy. `ADMIN_APP_URL`, `STUDENT_APP_URL`, and `PUBLIC_API_URL` are not current
application configuration keys and must not be introduced as substitute
settings without a corresponding source change.

If a browser gets a `404 Cannot GET /api/v2/health`, use `/health` or `/ready`:
only business routes use the `/api/v2` global prefix. If authentication works
on one portal but not the other, first compare the exact request `Origin` to
`CORS_ORIGINS`, confirm the API cookies remain `Secure` and `HttpOnly`, and
confirm the reverse proxy forwards `X-Forwarded-Proto`. Do not solve either
condition by allowing wildcard credentialed CORS, storing tokens in local
storage, or widening `COOKIE_DOMAIN`.

## Local verification

Run focused source checks:

```bash
npm --prefix apps/admin test -- --run src/app/routing/portal-domain.test.ts
npm --prefix apps/admin run typecheck
npm --prefix apps/api test -- --runInBand test/cors-policy.spec.ts
```

Then use separate browser profiles for both browser hosts to verify login,
logout, session restoration, authorized deep links, denied staff routes from
the student host, CSRF mutations, notifications, and SSE. Verify the API
separately with `https://api.sultano.ir/ready` and allowed plus denied CORS
preflights. These browser and deployment checks cannot be proved from this
repository alone.

## Rollback

Do not roll back a migrated SQLite volume merely by starting an old image.
Before a release, retain the prior immutable image pair and take a verified
WAL/SHM-aware backup. If a failure occurs after migration may have run, remove
public ingress, preserve the evidence and volume, and follow the recovery
runbook using the verified backup.
