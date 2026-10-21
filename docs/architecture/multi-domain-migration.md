# Multi-domain migration plan

**Status:** Phases 1 and 2 source changes are implemented and validated locally. Edge/DNS/TLS configuration and a production rollout remain pending.

**Target domains**

| Surface                         | Canonical URL             | Owner                              |
| ------------------------------- | ------------------------- | ---------------------------------- |
| Student portal                  | `https://stud.sultano.ir` | the shared Vite application        |
| Staff and administration portal | `https://app.sultano.ir`  | the same compiled Vite application |
| Public API                      | `https://api.sultano.ir`  | NestJS/Fastify                     |

## Decision and non-goals

The repository already contains the intended starting point: one React/Vite application at `apps/admin`, which currently contains both staff and student capability-aware routes. `apps/student` is absent from this checkout; it must **not** be recreated. The migration will build the `apps/admin` image once and make that same immutable image available at both browser hosts. Host-aware routing will decide which portal entry experience is appropriate, while the API remains an independently addressable `/api/v2` service for browsers, mobile applications, and authorized integrations.

This plan does not split the backend, replace the router, create a second React build, alter API DTOs, remove routes, or change SQLite schema. It is also not authorization redesign: server-side capability and organization checks remain the authority.

### Phase 1 implementation record (2026-10-18)

- `apps/admin/src/app/routing/portal-domain.ts` now resolves only the approved `stud`/`app` production and localhost development hostnames. `localhost` retains the existing development experience; unknown hosts render no portal.
- The existing `/admin` route tree remains a single lazy-loaded Vite application. A router boundary restricts student-only routes to the Student host and prevents them on the Administration host. Existing capability routes still determine access after the host policy.
- Login preserves a permitted deep link, chooses the Administration host for a multi-role account with a non-student role, and uses the existing server-verified `setActiveRole` flow when a portal needs a different active role. It does not grant authorization based on hostname.
- Vite now runs on loopback-only `localhost:5173` and has an explicit local-host allowlist. One production build completed successfully; browser automation was unavailable in the validation environment, so production-host browser smoke remains required.

## Verified current architecture

### Repository and deployable units

- The root `package.json` is orchestration only. `tooling/workspace/projects.json` is the package DAG and the repository uses package-local lockfiles rather than npm root workspaces.
- `apps/admin` is the `moshaver-admin-v2` React 19/Vite 8 application. Its Vite build uses manual vendor chunks and React/React DOM deduplication. It imports local `@moshaver/api-contract` and `@moshaver/admin-workspace-ui` packages.
- `apps/api` is the `moshaver-backend-v2` NestJS/Fastify modular monolith. It mounts `/api/v2`; `/health` and `/ready` remain unprefixed. TypeORM uses `better-sqlite3` at `DATABASE_PATH`, with migrations run at startup, `synchronize: false`, WAL, foreign keys, and a configurable busy timeout.
- `student-core` is runtime-neutral domain code. It is not a browser application. The historical `apps/student` directory is absent, despite older documents and one stale Compose file referring to it.
- `docker-compose.production.yml` is the current two-service production composition: `backend-v2` owns the named `moshaver_v2_sqlite` volume and `admin-v2` serves the built SPA through Nginx. The immutable release path uses content-addressed images, an external existing database volume, pre-deploy backup/restore/rehearsal, readiness probes, and a receipt.

### Browser application, routes, and access control

- `apps/admin/src/main.tsx` creates one browser router, applies global RTL/Persian defaults, and wraps it in `AppProviders` and an error boundary.
- `apps/admin/src/app/routing/router.tsx` uses `createBrowserRouter`, lazy route modules, `ProtectedRoute`, and `CapabilityRoute`. Student-specific routes such as `/my-profile` and `/my-leave-requests` are lazy modules in the same app; staff routes such as `/students`, `/organizations`, `/users`, `/settings`, `/system`, and `/sms` are also lazy modules in that router.
- `ProtectedRoute` currently redirects an unauthenticated user to `/login`, rejects unsupported or unreleased roles, and then renders the shared `AdminLayout`. `CapabilityRoute` evaluates `auth.can`, `auth.canAny`, and `auth.canAll`; this is UI gating, not the API authorization boundary.
- `AuthProvider` is the client-side session/context owner. API work context is carried through `X-Work-Role` and `X-Organization-Id`; the server enriches and validates it. The migration must retain context refresh on role/organization switching.
- `apps/admin/src/shared/api/api.ts` uses `fetch(..., { credentials: "include" })`, stores the CSRF token in `sessionStorage`, sends it for mutations, retries one 401 after refresh, and retries one CSRF failure after obtaining a current token. It has a development backend switcher and currently composes `/api/v2` URLs.
- Realtime is authenticated Server-Sent Events, not WebSocket: the frontend constructs `EventSource(..., { withCredentials: true })` for `/events`; Nest's `RealtimeController` emits SSE and `RealtimeService` uses an in-memory hub. Nginx already disables proxy buffering for API traffic.
- The PWA registers one root-scoped `/sw.js` only in production. Its cache is origin-scoped, excludes API/auth/session traffic, and prevents cross-origin navigation targets. Each new frontend host will therefore have an independent service-worker registration and cache.

### Current edge, auth, and API behavior

- The Admin image builds with `VITE_API_URL=/api/v2`. Its Nginx template serves SPA fallback and proxies `/api/v1`, `/api/v2`, `/health`, and `/ready` to `API_PROXY_TARGET`.
- Fastify registers Helmet, `@fastify/cookie`, and `@fastify/cors` with `credentials: true`; the CORS allowlist comes from `CORS_ORIGINS` or environment-specific defaults. Existing production fallback origins are `https://st.mahakaram.ir` and `https://admin.mahakaram.ir`.
- Authentication uses short-lived HttpOnly access and rotating HttpOnly refresh cookies. Cookie attributes presently include path, HttpOnly, secure, SameSite, and expiry, but no configurable `Domain` attribute. CSRF is enforced by the global guard for authenticated `POST`, `PUT`, `PATCH`, and `DELETE` requests against the session-bound token; no separate Origin/Referer allowlist is implemented in that guard.
- Current production Compose defaults to secure cookies and `SameSite=lax`; its required `CORS_ORIGINS` environment variable is deliberately external. This supports an API-only host only after the browser clients are explicitly allowed and the cookie scope is designed.

### Delivery, recovery, and data safety

- CI runs workspace validation, architecture/contract checks, component verification, security checks, browser test selection, image readiness, and a CI Gate. A successful `main` CI dispatches the exact SHA to the private deployment repository; that dispatch alone is not production proof.
- `scripts/deploy/verify-release.sh` is a disposable-only rehearsal. It builds the images, tests HTTPS/Nginx/readiness, seeds disposable data, runs critical authenticated smoke flows, and verifies SQLite backup/restore and candidate migration preservation.
- `scripts/deploy/database-recovery.cjs` copies the stopped SQLite database plus WAL/SHM files, creates a verified backup, and rehearses the candidate migration chain against a restored copy. `scripts/deploy/lan-immutable.sh` stops the old stack only after its gates, persists a verified backup, starts the candidate, verifies image identity and readiness, and records a receipt. If replacement fails after possible live migrations, it deliberately stops ingress rather than claiming an automatic safe rollback.

## Current risks and migration impact

| Finding                                                             | Evidence                                                                                                                                                  | Risk                                                                                                                                                                                    | Required disposition                                                                                                                                                                                           |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy public hostnames are embedded in source and Compose          | `apps/api/src/config/app.config.ts`, `apps/admin/src/shared/api/api.ts`, `apps/admin/vite.config.ts`, `docker-compose.yml`, `apps/api/docker-compose.yml` | A missing production variable silently admits or calls the old domain.                                                                                                                  | Replace only production defaults with explicit `sultano.ir` configuration in the implementation phase; add a repository check for legacy production hosts where appropriate.                                   |
| API URL is built as same-origin by default                          | `apps/admin/src/shared/api/api.ts`, Admin Docker build arg                                                                                                | The two new frontend origins need an explicit API origin or a reverse proxy on both hosts.                                                                                              | Choose `https://api.sultano.ir/api/v2` as the production build value; retain relative `/api/v2` for local proxy development.                                                                                   |
| Cookies lack `Domain`                                               | `apps/api/src/modules/auth/auth.controller.ts`, `apps/api/src/config/auth.config.ts`                                                                      | Host-only cookies set by `api.sultano.ir` are still sent to the API, but cannot support a deliberate parent-domain session strategy. An accidental broad domain would enlarge exposure. | Add an optional, validated `COOKIE_DOMAIN`; set `.sultano.ir` only if shared-subdomain SSO is a product requirement. Prefer host-only API cookies unless cross-subdomain cookie access is explicitly required. |
| CORS is allowlist-based but old fallbacks remain                    | `apps/api/src/main.ts`, `apps/api/src/config/app.config.ts`                                                                                               | Browser calls and credentialed SSE fail, or a wrong fallback is used.                                                                                                                   | Require exactly `https://stud.sultano.ir,https://app.sultano.ir` for the API deployment; verify preflight and SSE CORS credentials.                                                                            |
| CSRF checks token but does not separately validate Origin           | `apps/api/src/common/guards/csrf.guard.ts`                                                                                                                | Token CSRF remains the primary control, but a multi-origin browser API benefits from explicit origin defense in depth.                                                                  | Define an API origin policy for mutating cookie-authenticated browser requests, allow the two browser origins, and preserve non-browser authorized-client behavior with an explicit authentication mode.       |
| Absolute router paths are extensive                                 | `apps/admin/src/app/routing/router.tsx` and navigation components                                                                                         | They are SPA paths, not hostnames. A host switch or role redirect can send a user into the wrong portal if treated as globally neutral.                                                 | Inventory redirects and navigation intents; centralize portal-entry/host policy without rewriting feature routes.                                                                                              |
| Role checks exist at the route shell                                | `ProtectedRoute` in `router.tsx`                                                                                                                          | A new host policy can create login/unsupported-role loops if it redirects before restored context is authoritative.                                                                     | Test direct deep links, expired sessions, role changes, unsupported roles, and both portal hosts before enabling canonical redirects.                                                                          |
| Lazy routes and service worker are intentionally present            | `router.tsx`, `vite.config.ts`, PWA files                                                                                                                 | New host deployments can serve mismatched cached chunks or duplicate a worker per origin.                                                                                               | Keep one artifact/version for both hosts; smoke first load, old-worker upgrade, offline fallback, and lazy-route retry on each origin.                                                                         |
| Bundle pressure is known but bounded                                | `vite.config.ts`, `apps/admin/scripts/audit-release.mjs`, release report                                                                                  | A host selector must not eagerly import portal-only feature trees.                                                                                                                      | Preserve lazy boundaries/manual chunks and rerun release bundle audit; use route-level lazy imports for any new portal-entry modules.                                                                          |
| Realtime is in-process SSE                                          | realtime module/service                                                                                                                                   | It is not safe for multiple API replicas without a shared event transport; proxy buffering or CORS can also break streams.                                                              | Keep API at one replica for this migration, verify SSE from both hosts, and separately plan a broker before horizontal scaling.                                                                                |
| Stale deployment definition references a missing Student Dockerfile | `docker-compose.coolify.yml`                                                                                                                              | Coolify deployment can fail or accidentally rebuild an obsolete topology.                                                                                                               | Treat as a release blocker: retire or align it with the one-image/two-host topology before any Coolify deployment.                                                                                             |
| Multiple Compose/deployment paths exist                             | root Compose variants, LAN overlays, Coolify file                                                                                                         | Domain changes can be made in one path but not the deployed path.                                                                                                                       | Identify the selected production target before editing; validate every supported deployment descriptor or formally deprecate obsolete ones.                                                                    |
| SQLite is a single persistent volume with WAL                       | production Compose, data source, recovery scripts                                                                                                         | Concurrent writers, volume replacement, or an untested rollback after migration can lose availability/data.                                                                             | Keep one writer, do not use `down --volumes`, preserve WAL/SHM-aware backup, rehearse the exact candidate migration, and retain old image/bundle plus verified backup.                                         |
| Existing backend dependency cycles are a tracked baseline           | `tooling/architecture/baseline.json`                                                                                                                      | A new host policy module could accidentally deepen app/package coupling.                                                                                                                | Run architecture checks and do not import admin application code into shared/runtime-neutral packages.                                                                                                         |

## Implementation plan

### Phase 0 — decisions and inventory (no production cutover)

1. Confirm DNS/TLS ownership and whether `api.sultano.ir` is exposed directly at the edge or through the existing deployment receiver.
2. Choose the cookie scope. The recommended default is **host-only secure cookies on `api.sultano.ir`**, `SameSite=Lax`, `HttpOnly`, and credentialed requests from the two same-site sibling portals. Set `COOKIE_DOMAIN=.sultano.ir` only after an explicit SSO/cookie-sharing requirement and security review.
3. Decide the canonical behavior for an authenticated student opening `app.sultano.ir` and staff opening `stud.sultano.ir`: show a controlled portal-selection/denied state first; do not implement automatic cross-host redirects until loop tests pass.
4. Inventory every `Navigate`, `useNavigate`, `Link`, `href`, `window.location`, login success target, notification deep link, and PWA push URL. Classify each as same-portal, portal-entry, or deliberately external.
5. Select one authoritative production descriptor. The current immutable LAN path is source-grounded; the Coolify descriptor is not usable as-is because it references `apps/student/Dockerfile`.

### Phase 1 — make the shared browser application host-aware

1. Add a small browser-only portal-host policy module under `apps/admin/src/app/` that recognizes exactly `stud.sultano.ir`, `app.sultano.ir`, configured development hosts, and unknown hosts. It must be inert for local development and testable without changing domain features.
2. Use that policy at router entry/protected-route boundaries to choose the student versus staff portal entry experience. Preserve the existing routes, `AdminLayout`, lazy modules, and capability checks.
3. Introduce one portal-navigation helper only for cross-portal handoffs. Preserve ordinary React Router absolute paths as in-app paths; do not mass-rewrite navigation paths.
4. Update notification/PWA deep-link policy to reject or safely normalize a host-incompatible path. Continue to enforce same-origin service worker navigation.
5. Add router/auth regression tests for unknown host, direct deep link, unauthenticated login, restore failure, student/staff/guardian roles, unsupported roles, role switch, and no redirect loop.

### Phase 2 — make the API a first-class independent origin

1. Implemented: API configuration now validates optional `COOKIE_DOMAIN`, defaults to host-only cookies, and applies the same attributes when setting and clearing both access and refresh cookies.
2. Implemented: the production frontend build defaults to `VITE_API_URL=https://api.sultano.ir`; the client adds its existing `/api/v2` path. Development retains the same-origin `/api/v2` proxy default.
3. Implemented: CORS defaults and example deployment configuration list the two exact HTTPS browser origins. CORS emits credentialed grants only for configured Origin values; no-Origin clients continue to the normal authentication/authorization boundary.
4. Implemented: Fastify trusts forwarded headers only when `TRUST_PROXY=1` and the peer is in the configured private/local proxy ranges. The production descriptor supplies the safe default list.
5. Still required at the API edge: terminate TLS, keep the API upstream private, strip externally supplied forwarding headers before setting Nginx's own `X-Forwarded-*` values, and proxy `/api/v2/events` with `proxy_buffering off`, `proxy_cache off`, and a read timeout above the 25-second SSE heartbeat.
6. Add a defense-in-depth Origin policy for cookie-authenticated mutations. Its exemptions must be explicit and tested for health/readiness, login/bootstrap flows as appropriate, and future non-browser authorized clients. Do not rely on CORS as authorization.
7. Keep `/api/v2`, response envelopes, cookie names unless intentionally versioned, CSRF semantics, capability guards, organization scope, OpenAPI, and SSE endpoint contracts stable.

### Phase 3 — ship one compiled frontend artifact at two domains

1. Build `apps/admin` once with the independent API URL and immutable `RELEASE_SHA`. Do not run two Vite builds with host-specific code.
2. Configure the selected edge/deployment system so both `stud.sultano.ir` and `app.sultano.ir` route to the same `admin-v2` image/container or the same immutable image digest. Preserve SPA fallback, `/manifest.webmanifest` and `/sw.js` no-cache rules, and security headers.
3. Route `api.sultano.ir` only to `backend-v2`; do not serve the frontend from the API container. Preserve forwarded proto/host/IP headers and `TRUST_PROXY=1` only when behind the trusted edge proxy.
4. Remove the obsolete `student-v2` service from the Coolify topology (or mark the file unsupported) rather than replacing it with a new application. Align all retained Compose examples and operations documentation with the selected topology.
5. Provision valid TLS for all three names, publish DNS with low TTL before cutover, and confirm no HTTP downgrade or accidental wildcard host routing.

### Phase 4 — staged cutover and verification

1. Run a disposable release rehearsal using the exact candidate images and environment values. It must include a populated SQLite backup/restore and migration rehearsal before the live volume is touched.
2. Deploy the API and shared frontend image through the protected `develop` → `main` release path. Do not claim deployment from source CI or dispatch alone.
3. Before changing canonical DNS/ingress, run browser smoke tests on both hostnames: login/refresh/logout, role/context switch, staff and student deep links, capability denial, mutation plus CSRF refresh, SSE reconnect, PWA install/update/offline navigation, and a notification deep link.
4. Verify `https://api.sultano.ir/ready`, CORS headers for each allowed origin, cookie attributes in a real browser, API OpenAPI endpoint, and the exact deployed image/SHA.
5. Record the release receipt, image digests, TLS evidence, CORS allowlist, cookie-domain decision, verified database backup, and post-cutover smoke evidence.

## Expected file changes

The exact final set depends on the Phase 0 deployment-target decision. The expected implementation scope is deliberately narrow:

| File                                                                                                     | Planned change                                                                                                                                                           |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/admin/src/app/routing/router.tsx`                                                                  | Integrate host-aware portal entry/redirect guard while preserving routes and capability gates.                                                                           |
| `apps/admin/src/app/portal-host.ts` (new)                                                                | Strict host classification and portal-entry policy, with unit tests.                                                                                                     |
| `apps/admin/src/app/portal-navigation.ts` (new, if inventory warrants)                                   | Centralized, allowlisted cross-portal handoff URLs.                                                                                                                      |
| `apps/admin/src/shared/api/api.ts`                                                                       | Distinguish local relative proxy URL from configured independent production API URL; retain credentials/CSRF/refresh/SSE behavior.                                       |
| `apps/admin/src/shared/api/api.test.ts`                                                                  | API-origin, credentials, refresh, CSRF, and SSE regression coverage.                                                                                                     |
| `apps/admin/src/app/routing/router-authorization.test.tsx` and/or new host-policy tests                  | Direct-link and redirect-loop coverage on both hosts.                                                                                                                    |
| `apps/admin/Dockerfile`                                                                                  | Set a build arg/default appropriate for an independent API origin only after deployment values are finalized.                                                            |
| `apps/admin/nginx.conf.template`                                                                         | Keep SPA/PWA behavior; remove or retain same-origin API proxy only according to the selected edge design, without changing its semantics accidentally.                   |
| `apps/api/src/config/app.config.ts`                                                                      | Replace legacy production-origin fallback and make the allowed browser-origin configuration explicit.                                                                    |
| `apps/api/src/config/auth.config.ts`                                                                     | Add validated optional cookie-domain/origin-policy configuration.                                                                                                        |
| `apps/api/src/modules/auth/auth.controller.ts`                                                           | Apply/clear the validated cookie domain consistently.                                                                                                                    |
| `apps/api/src/common/guards/csrf.guard.ts` or a new adjacent origin guard                                | Add tested defense-in-depth origin validation for cookie-authenticated mutations.                                                                                        |
| `apps/api/src/main.ts`                                                                                   | Adjust CORS registration only if required by the chosen validation policy; keep credentials and API prefix behavior.                                                     |
| API auth/security integration tests                                                                      | Cover allowed/denied CORS, preflight, cookie attributes, CSRF/origin policy, and SSE from both frontend origins.                                                         |
| `docker-compose.production.yml`                                                                          | Reference the final runtime environment and preserve one `admin-v2` image plus one backend/data volume.                                                                  |
| `docker-compose.coolify.yml`                                                                             | Remove/replace the stale `student-v2` service and declare the single-app topology.                                                                                       |
| `.env.coolify.example`, `deployment/lan/production.env.example`                                          | Document only non-secret `sultano.ir` CORS/cookie settings.                                                                                                              |
| Selected edge configuration in the deployment repository or approved host configuration                  | Add both frontend host rules and the API host rule. This repository does not contain the private receiver's live configuration, so that target is currently **UNKNOWN**. |
| `scripts/deploy/verify-release.sh`, `scripts/deploy/probe-release.sh`, and smoke tests                   | Extend disposable verification to exercise the final host/API topology; never point them at production data.                                                             |
| `.github/workflows/deployment-readiness.yml` and related workflow tests, if image/host assertions change | Keep the CI Gate aligned with the one-build/two-host release artifact.                                                                                                   |
| `docs/operations/*` and this document                                                                    | Update authoritative deployment, rollback, and evidence instructions after the implementation is proven.                                                                 |

## Files and contracts that must remain unchanged unless a separately approved need appears

- `tooling/workspace/projects.json`, root workspace model, and leaf lockfile strategy.
- The absence of `apps/student`; no second React application or new Student Dockerfile.
- `student-core` runtime-neutral boundary and CMB package dependency direction.
- API prefix `/api/v2`, unprefixed `/health` and `/ready`, response-envelope format, OpenAPI route, and existing endpoint DTOs.
- Server-side `AuthSessionGuard`, role/capability guards, organization-scoping rules, validation pipe, and audit boundaries; they may be hardened but never bypassed for the migration.
- SQLite schema, migrations, `synchronize: false`, WAL/foreign-key settings, and persistent volume identity.
- The existing immutable release, verified backup/restore/rehearsal, image-identity, readiness, and receipt gates.
- Existing PWA cache isolation and its no-cache delivery rules for `sw.js` and the manifest.

## Security requirements

1. HTTPS only; secure, HttpOnly session/refresh cookies; no secrets in Vite variables, source, Compose examples, or docs.
2. Exact CORS allowlist for the two browser origins, credentials enabled, no wildcard origin with credentials, and explicit negative-origin tests.
3. Cookie scope must be a documented decision. The least-privilege default is host-only API cookies; parent-domain cookies require security approval and browser verification.
4. Preserve session-bound CSRF tokens, rotation, single-refresh behavior, and mutation retry limits. Add Origin validation as defense in depth without breaking non-browser authorized clients.
5. Keep server authorization authoritative: host/route/UI gates cannot grant a role, capability, organization, or student scope.
6. SSE must remain authenticated, credentialed, CORS-validated, unbuffered at every proxy, and protected by the same session lifecycle.
7. Preserve security headers, proxy trust boundaries, request-size limits, rate limits, audit logs, and safe error envelopes.

## Test and acceptance requirements

### Source and automated checks

- `npm run workspace:check`, `npm run workspace:list`, and `npm run workspace:plan -- build`.
- Affected Admin typecheck, format, lint, unit, accessibility, router, API-client, and release-bundle checks.
- API lint, unit/integration/security tests, build, and CORS/cookie/CSRF/SSE additions.
- Architecture boundary and contract checks; no newly introduced cycle or admin-app import from a shared/runtime-neutral package.
- Disposable Docker/Compose rehearsal, Nginx syntax check, migration preservation rehearsal, backup/restore verification, and critical smoke flow.

### Browser and environment acceptance

For **each** of `stud.sultano.ir` and `app.sultano.ir`, verify a fresh browser profile and an upgrading PWA profile: root/login, deep link, login/logout/refresh, expired session, role/context switching, capability denial, state-changing CSRF request, SSE connection/reconnect, service-worker update, offline fallback, and notification click behavior. Verify that an incorrect portal/role does not loop between hosts.

For `api.sultano.ir`, verify `/ready`, `/api/v2/openapi.json`, allowed and denied CORS preflights, credentialed request/response cookies, authenticated SSE headers/stream, and a real authorized mutation. These are separate from source test evidence.

## Deployment and rollback strategy

1. Do not change live domains before a successful disposable rehearsal of the exact images and production-like environment values.
2. Deploy through protected release promotion only. Record the exact `main` SHA, CI Gate, source handoff, receiver deployment run, image digests, live readiness, browser smoke result, and backup receipt.
3. Before candidate startup, stop the single SQLite writer, take the existing WAL/SHM-aware verified backup, restore it, and rehearse candidate migrations on the restored copy. Never use `docker compose down --volumes`.
4. If preflight fails before replacement, restart the old verified containers. If failure occurs after candidate migrations may have touched live data, stop public ingress, preserve logs/volume/backup, and use an incident runbook; do not blindly run an old image against a migrated database.
5. Roll back DNS/edge routing only if the old and new API/cookie contract remains compatible. Restore SQLite only from the verified backup in a controlled recovery procedure after integrity review; it is not a routine rollback button.
6. Retain the prior immutable image pair, release bundle, receipt, verified backup, and deployment evidence until the agreed observation window closes.

## Blockers before implementation

1. **Production edge is UNKNOWN in this checkout.** The private deployment receiver/host configuration that owns live DNS, certificates, and virtual-host routing is not present. Its exact files and authority must be identified before implementation.
2. **Coolify topology is stale.** `docker-compose.coolify.yml` references `apps/student/Dockerfile`, but that directory does not exist. It must be repaired or explicitly retired before it can be used.
3. **Cookie-domain/product decision is unresolved.** The target works with host-only API cookies; `.sultano.ir` cookies should not be assumed. Confirm the desired SSO/session scope before adding configuration.
4. **Portal behavior for cross-role host visits is unresolved.** Confirm whether to show a controlled denial/selector or redirect users to the other host. This determines redirect-loop policy and tests.
5. **Current working tree is heavily modified outside this task.** Migration implementation must be isolated to the approved files and must not stage/reset unrelated work.

## Implementation exit criteria

The migration is complete only when the same verified frontend image digest serves both browser domains, the API is independently reachable at `api.sultano.ir`, all security and browser acceptance cases above pass, the stale deployment descriptor is resolved, and the protected deployment path has recorded live readiness, authorized-flow smoke, and a verified SQLite backup/receipt for the exact release SHA.
