# Multi-domain verification

**Recorded:** 2026-10-18  
**Scope:** the single `apps/admin` Vite application served on `stud.sultano.ir` and `app.sultano.ir`, with the independent NestJS/Fastify API at `api.sultano.ir`.

This is source and local-build evidence. It is not production evidence and does not assert DNS, TLS, browser-cookie, device, or deployment-receiver success.

## Architecture assertion

- There is one React/Vite application (`apps/admin`) and one production Vite build.
- Exact hostname resolution lives in `apps/admin/src/app/routing/portal-domain.ts`; unsupported hosts render no authenticated portal.
- All page routes are React lazy imports from `router.tsx`. Browser hostname selection does not grant a role or capability; the established authenticated context, `CapabilityRoute`, and API guards remain authoritative.
- `apps/student` is absent. It was not recreated.

## Performance audit and fix

### Findings

| Area                    | Finding                                                                                                                                                                                                  | Action / status                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route code              | Feature route pages already used `React.lazy`; the initial entry did not preload Students, System, or SMS route chunks.                                                                                  | Retained.                                                                                                                                                 |
| Dashboard               | `DashboardPage` statically imported the student, teacher, guardian, school-manager, and operational dashboards. Thus its one route chunk contained role-specific code that a student could never render. | Fixed: role dashboard implementations now lazy-load independently.                                                                                        |
| Shell attendance prompt | `AdminLayout` imported the student attendance prompt through the attendance public barrel, causing the attendance API to be module-preloaded by the document.                                            | Fixed: direct lazy import only after `attendance.self.read` is authorized.                                                                                |
| Large Excel dependency  | `spreadsheet` remains 929.48 KiB minified / 256.40 KiB gzip.                                                                                                                                             | Expected on-demand ExcelJS chunk; it is not an entry preload and remains within the existing 1 MiB release exception.                                     |
| Shared shell            | `AdminLayout`, providers, navigation, auth, notifications, and responsive shell are shared initial code.                                                                                                 | Kept intentionally: they provide the current RTL/mobile/dark-mode shell and authorization-aware navigation. Further split requires real mobile profiling. |
| Circular dependencies   | Graphify was queried for the route/import graph; no source-backed circular-import finding was returned. No circular-dependency checker is configured in this package.                                    | No unverified claim of complete absence.                                                                                                                  |
| Image/icon resources    | The entry references only manifest and application icons; dashboard and attendance changes added no image/icon resource.                                                                                 | No change needed.                                                                                                                                         |

### Code-splitting result

The dashboard route was measured from the local generated production build before and after this focused change:

| Artifact                    |                                     Before |     After | Interpretation                                              |
| --------------------------- | -----------------------------------------: | --------: | ----------------------------------------------------------- |
| Shared dashboard route      |                                 121.68 KiB | 43.11 KiB | Role-independent dashboard selector only.                   |
| Student dashboard route     |                       bundled in dashboard | 10.56 KiB | Requested only for the Student dashboard.                   |
| Operational dashboard route |                       bundled in dashboard | 65.42 KiB | Requested only for operational roles.                       |
| Student attendance prompt   | entry-preloaded through its API dependency | 20.13 KiB | Requested only after the authorized student prompt renders. |

The post-change `index.html` module-preload list contains the shared runtime, React, router, query, UI, vendor, popover, and theme chunks. It does **not** preload Students, System, SMS, dashboard-role, or student-attendance-workspace chunks. The raw module-preload total is 1005.89 KiB; it is a build-artifact sum, not a network or compressed transfer estimate. It must not be compared to an older build total because unrelated dirty worktree changes alter shared chunk composition.

## Test cases and results

| Area                                   | Cases                                                                                                                                     | Actual result                                                                                                                                                     |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hostname policy                        | Exact app/student/local/unknown resolution, unsupported-host handling, path/domain policy, multi-role destination rules                   | `portal-domain.test.ts`: included in the focused Admin run; passed.                                                                                               |
| Login and redirects                    | Login deep links, cross-host destination selection, multi-role handling                                                                   | `LoginPage.test.tsx`: included in the focused Admin run; passed. Browser-host flows remain pending.                                                               |
| Frontend API/session behavior          | Credentials mode, refresh retry, CSRF retry, work context                                                                                 | `api.test.ts`: included in the focused Admin run; passed.                                                                                                         |
| Focused Admin regression set           | Hostname, login, and API client tests                                                                                                     | 3 files / 27 tests passed.                                                                                                                                        |
| Accessibility                          | Automated axe coverage                                                                                                                    | 1 file / 6 tests passed.                                                                                                                                          |
| API parity                             | Mounted controllers have an Admin consumer                                                                                                | Passed: 376 backend routes; 290 Admin-applicable routes represented.                                                                                              |
| CORS/session/authorization integration | portal CORS origins, disallowed origin, no-Origin client, cookie domain, CSRF/logout, expired session, tenant and relationship boundaries | 3 API suites / 21 tests passed.                                                                                                                                   |
| Backend type/build                     | TypeScript and Nest production build                                                                                                      | `npm run lint` and `npm run build` passed.                                                                                                                        |
| Admin type/build                       | TypeScript, ESLint, Vite production build                                                                                                 | `npm run typecheck`, `npm run lint`, and `npm run build` passed.                                                                                                  |
| Browser E2E discovery                  | desktop RTL/LTR, mobile layout, planner, roles, Student, multi-role, archive/restore scenarios                                            | Playwright discovered 20 tests in 3 files. They were not run because no seeded disposable browser environment was supplied.                                       |
| Full Admin unit suite                  | all Vitest tests                                                                                                                          | Invoked, but this runner ended after startup without a completion summary. It is **inconclusive**, not a pass. Re-run in CI or a non-sandboxed local environment. |
| Backend security E2E                   | live seeded cookie/CSRF/role matrix                                                                                                       | Failed to start against `127.0.0.1:4000`: `ECONNREFUSED`. No local disposable API was running; this is an environment blocker.                                    |

## Security review

| Control                        | Finding                                                                                                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cookies                        | Access and refresh cookies are HttpOnly, secure in production, and host-only on `api.sultano.ir` unless a validated `COOKIE_DOMAIN` is explicitly supplied.                      |
| CSRF                           | Authenticated mutations require a session-bound CSRF token. The client keeps only that token in `sessionStorage`; sensitive tokens stay in HttpOnly cookies.                     |
| CORS                           | Exact origins are configured through `CORS_ORIGINS`; allowed origins receive credentialed headers. Disallowed and no-Origin requests are not treated as authorization decisions. |
| Authorization                  | Fastify’s global session, role, capability, and CSRF guards remain installed. Route host policy is UI containment only.                                                          |
| Tenant/relationship boundaries | The API security integration suite passed organization, guardian/student, foreign-resource, session, and role-context cases.                                                     |
| Hostname tricks                | Unknown hosts render a controlled unavailable state. Student-only UI paths are unavailable from the Admin domain, while backend authorization remains mandatory.                 |
| Redirect validation            | Portal URLs are built from exact known hostnames and preserve only route paths accepted by the portal policy.                                                                    |
| Frontend secrets               | The generated entry references no configured secret values. A build artifact scan and deployment secret-manager review remain required before release.                           |

## Responsive and UX review

Source review preserved the existing single responsive shell, RTL direction, Persian defaults, theme provider, keyboard command-palette behavior, reduced-motion/device-performance handling, touch/mobile navigation, and lazy-route fallback states. The automated accessibility suite passed.

No browser or device screenshot was available in this environment. Real narrow-phone, tablet, desktop, keyboard, reduced-motion, dark-mode, and authenticated Student-domain verification remain required.

## Required pre-deployment blockers

1. Start a migrated, seeded **disposable** API and execute `apps/api` `npm run test:e2e:security` successfully; never use production data.
2. Serve the one built Admin artifact under both real hostnames and run the 20 Playwright tests plus manual Student/Admin/multi-role login, deep-link refresh, session expiry, logout, API-failure, and redirect-loop smoke tests.
3. Verify production edge TLS, SPA history fallback, API CORS headers, host-only cookie behavior, SSE buffering/timeouts, and trusted proxy headers.
4. Re-run the full Admin unit suite to a completion summary, then the release-quality workspace gates.
5. Before promotion, follow the protected release path with backup, exact-SHA CI/receiver evidence, live `/ready`, and authorized-flow smoke. A local build or source CI alone is not deployment proof.
