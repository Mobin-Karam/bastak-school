# Production hardening audit — 2026-10-23

Scope: the `bastak-school` source tree and the current
`Mobin-Karam/bastak-school-deploy` workflow. This audit distinguishes observed
defects from risks and policy decisions. It did not access or mutate production
data.

## Release decision

The CORS and mutable-image defects below are release blockers. The source-tree
fixes make browser mutation preflights explicit, exercise them in the disposable
HTTPS release smoke, and make production Compose fail closed unless a release SHA
and both immutable image references are supplied.

The private deployment workflow remains a separate blocker until it is updated
to the repository's reviewed immutable workflow template and validated on its
self-hosted runner. No production deployment is authorized by this audit.

## Findings

| Severity | Area | Status | Evidence and root cause | Remediation and acceptance |
| --- | --- | --- | --- | --- |
| P0 | Browser CORS | Confirmed defect; fixed on this branch | `apps/api/src/main.ts` omitted `methods`; `@fastify/cors` therefore advertised only `GET,HEAD,POST`. The old test requested only POST. | Configure all supported methods, test credentialed PUT/PATCH/DELETE preflights for both portal origins, and repeat the assertion through the disposable HTTPS smoke. A requested mutation method must appear in `Access-Control-Allow-Methods`. |
| P0 | Production images | Confirmed defect; fixed on this branch | `docker-compose.production.yml` defaulted both services to mutable `:latest` and the revision to `development`. Release scripts supplied pins, but a direct Compose invocation did not. | Require `RELEASE_SHA`, `BACKEND_IMAGE`, and `ADMIN_IMAGE`. Disposable config checks supply explicit fixture values. Compose without these values must fail before container creation. |
| P0 | Private deployment path | Confirmed deployment drift; external follow-up required | The current private `server-deploy.yml` copies host configuration into the checkout and invokes legacy `lan.sh`. The reviewed `.github/deployment/server-deploy.yml` uses the verified release bundle, protected host paths, content-addressed images, and `lan-immutable.sh`. | Update the private repository through review, enable its protected `IMMUTABLE_DEPLOY_ENABLED` variable, then perform a non-production workflow/config validation before any release. |
| P1 | Frontend/backend operations | Confirmed test gap | `tooling/contracts/check-api-contract.mjs` checks roles, capabilities, prefix, and envelope markers, but does not compare frontend method/path operations with generated OpenAPI. | Introduce a generated operation manifest and fixture tests in a separate focused change. Acceptance: a removed or method-changed backend route fails CI before image promotion. |
| P1 | Real browser release coverage | Confirmed test gap | CI executes a static desktop-layout Playwright grep; authenticated specs are environment-gated. Node smoke did not model browser preflight, announcements, role editing, or principal dashboard. | This branch adds real HTTPS preflight coverage. Add a seeded Playwright release journey for the remaining workflows; it must run rather than merely be listed. |
| P1 | Tenant and role authorization | Verified controls; regression gaps remain | `AuthService.userFromToken()` reloads session/user state and `AuthorizationService.enrich()` derives authority from active assignments and memberships. Foreign organizations and unassigned roles are rejected. Existing security tests cover forged platform role, cross-school data, revoked relationships, CSRF, refresh replay, and foreign session revocation. | Add HTTP tests for cross-school/platform/self role changes, last-authority revocation, old CSRF after refresh, and foreign phone-change approval. Assert persistent state is unchanged. No privilege escalation was confirmed. |
| P1 | Role-edit transaction | Confirmed consistency risk | `UsersPage` updates the profile and then roles in two requests. If the second fails, the server retains the first change while the UI presents the operation as failed. | Prefer one atomic backend command, or split the UI operations and refresh after partial failure. Add a first-success/second-failure regression test. |
| P1 | Mutation feedback | Confirmed UX defect | Global React Query mutation callbacks emit notifications while multiple pages also emit local notifications, producing duplicate or inconsistent feedback. Transport/CORS failures necessarily collapse to status `0` in browser JavaScript. | Establish one notification owner and a centralized Persian error presenter for 401/403/validation/conflict/network. Test that each mutation produces one message. |
| P1 | Startup migrations | Design risk, not a failure observed in this audit | TypeORM startup migrations can change schema before a container is accepted. The immutable deployment path stops writers, backs up the live volume, and rehearses migrations against a restored copy. | Preserve those safeguards. Require additive/backward-compatible migrations or an explicit reviewed recovery plan for destructive changes. |
| P1 | Failed replacement recovery | Confirmed operational limitation | `lan-immutable.sh` closes ingress after a failed post-replacement check rather than blindly starting an older binary against a possibly migrated schema. | Document and exercise a controlled recovery decision using the verified backup and migration state. Do not add unsafe automatic rollback. |
| P1 | Backup retention | Verification required | Repository scripts verify local SQLite backups and restored-copy migrations. Off-host encrypted retention and scheduled restore tests are policy/documentation only in the reviewed source. | Establish monitored off-host retention and periodic restore evidence with defined RPO/RTO. |
| P2 | API documentation exposure | Confirmed behavior; policy decision | Swagger UI and OpenAPI JSON are mounted unconditionally, and release probing expects the JSON endpoint. No exploit was established. | Decide whether documentation is public. If restricted, keep CI generation and an authenticated/internal compatibility probe. |
| P2 | Coverage/a11y/performance | Confirmed gate limitations | Admin coverage includes stale paths and currently measures a very small utility subset. Accessibility is jsdom-focused with color contrast disabled; runtime performance has no browser budget. | Repair coverage inputs first, then add targeted browser accessibility and stable runtime budgets without treating unavailable external services as passes. |
| P2 | Mixed HTTP adapters | Confirmed maintainability issue | Fastify is the runtime while Express/Multer compatibility remains and an Express-based document module is intentionally not mounted. | Remove unused dependencies or complete a Fastify-native upload slice with authorization, size/type, and storage tests in a separate change. |

## Production-data boundary

No database was deleted, reset, recreated, or migrated by this audit. Validation
must continue to use disposable databases and restored copies. The named
production SQLite volume and all student records remain outside the scope of
automated test cleanup.
