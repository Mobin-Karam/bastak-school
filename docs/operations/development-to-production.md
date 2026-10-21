# Development to production guide

This is the practical, current guide for developing, testing, releasing, and verifying Bastak School. It is based on the executable workspace, CI workflows, and LAN deployment scripts in this repository. It does not authorize direct production changes. The source repository contains the immutable-receiver template; whether the separately maintained private receiver has published and enabled it remains an operator verification, not a repository fact.

Use it with the [developer handbook](./developer-handbook.md), [repository runbook](./repository-runbook.md), and [GitHub CI/CD operations](./github-cicd.md). The latter is the authoritative guide for credentials, runner installation, and recovery.

## 1. Know what runs where

| Surface | Path | Responsibility |
| --- | --- | --- |
| API | `apps/api` | NestJS/Fastify modular-monolith API at `/api/v2`, TypeORM migrations, SQLite data |
| Web application | `apps/admin` | React/Vite application for staff and current student-facing views |
| Runtime-neutral student domain | `student-core` | Shared student-domain logic with no browser/runtime dependency |
| Contracts | `packages/api-contract` | Consumer-facing API contracts |
| Reusable backend platform | `packages/cmb/*` | CMB kernel and platform modules used by the API through public entrypoints |

`apps/student` is historical and absent in this checkout. Do not treat it as an install, test, or deployment target.

The repository uses **leaf lockfiles**: every installable project owns its own `package-lock.json`. The root `package.json` orchestrates the dependency graph in `tooling/workspace/projects.json`; it is not a unified npm workspace. Do not run a root `npm install`, add a root lockfile, or add npm workspaces as part of ordinary feature work.

Dependencies must point downwards: application composition roots → product/domain code → CMB platform → CMB kernel/public contracts. Read [dependency boundaries](../architecture/dependency-boundaries.md) before structural work.

## 2. Prerequisites and safe local setup

Install Node in the supported major version (root: `>=22.13 <23`; CI currently uses Node `22.23.3`), npm, Git, and Docker Compose if you will run deployment-readiness checks. For browser end-to-end tests, install the Playwright browser from `apps/admin`.

Start every task by preserving the checkout and creating a normal branch from current `origin/develop`:

```bash
git status --short
git fetch origin develop
./scripts/cicd/start-work.sh feat/short-description
```

The helper rejects a dirty checkout; preserve or commit existing work before switching branches. Branches must begin with `feat/`, `fix/`, `chore/`, or `ci/`. Never push directly to `develop` or `main`, force-push protected branches, reset production data, or commit generated outputs, databases, `.env` files, credentials, certificates, or local backups.

Before broad code discovery, use Graphify when `graphify-out/graph.json` exists; verify any files it identifies in source. Then identify the owning API contract, route/controller, service, migration/entity, Admin feature/API adapter, and nearby tests before editing.

### Install dependencies in graph order

For a fresh checkout or a repository-wide change:

```bash
npm run workspace:check
npm run workspace:list
npm run workspace:plan -- build
npm run bootstrap
```

For focused work, install only the affected leaf projects. `npm ci` is preferred when validating an existing lockfile; use `npm install` only when intentionally changing that project's dependencies and lockfile.

```bash
npm --prefix apps/api ci
npm --prefix apps/admin ci
npm --prefix student-core ci
```

Create local environment files from examples; do not put real secrets in them or Git:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/admin/.env.example apps/admin/.env
```

The API defaults to the compatibility-preserved SQLite path `apps/api/data/moshaver-v2.sqlite`, port `4000`, and insecure development cookies. The Admin defaults to `/api/v2` and its dev server uses port `8081`. Development seed and reset scripts are for disposable local data only; never run reset/seed commands against production.

## 3. Run the application locally

Run the API first, then the Admin in separate terminals:

```bash
npm --prefix apps/api run migration:run
npm --prefix apps/api run seed
npm --prefix apps/api run dev

npm --prefix apps/admin run dev
```

Open the Admin at `http://localhost:8081`. Confirm the API readiness endpoint before testing a flow:

```bash
curl --fail http://127.0.0.1:4000/ready
```

When working on a schema change, inspect migration history and data compatibility first. Create a TypeORM migration rather than relying on schema synchronization. Rehearse destructive or restore behavior only with a temporary SQLite path. Production is single-replica SQLite; do not attempt multi-replica write deployment without a separately reviewed storage/concurrency design.

## 4. Build changes safely

Trace a feature vertically before editing:

```text
navigation/route → page and feature UI → query or mutation adapter
→ controller and capability guard → service and validation → entity/migration
→ API contract, tests, operational documentation
```

For API work, preserve `/api/v2` compatibility unless a breaking change is explicitly approved. Synchronize `packages/api-contract` and every actual Admin/student consumer. Controllers define transport and capability requirements; services own business rules. Server authorization, organization/student scope, input validation, CSRF, and audit boundaries remain mandatory even when the UI hides an action.

For Admin work, gate pages and actions using capabilities from `/me/context` (`auth.can`, `auth.canAny`, `auth.canAll`, `CapabilityGate`, and `CapabilityRoute`), never a role name. Test loading, empty, error, disabled, keyboard, RTL, responsive, and narrow-viewport states. A role or organization switch must refresh `/me/context` before displaying newly gated UI or issuing feature requests.

## 5. Add a feature, logic, API, UI, or UX change

Start with a short delivery note before coding. It can live in the PR description for a small change and must state: the user outcome, affected roles and capabilities, organization/student scope, success and denied behavior, data/API changes, affected applications, migration/rollback implications, and the checks that will prove it. If any part is unknown, resolve it from source or explicitly mark it `UNKNOWN`; do not fill gaps with assumptions.

### Select the right implementation path

| Change type | Implement in this order | Minimum proof |
| --- | --- | --- |
| New business feature | Existing patterns/contract → service rule and server authorization → DTO/controller → data migration if needed → Admin adapter/UI → docs | Authorized success, denied API request, scope isolation, component/API test, browser flow |
| Change to business logic | Reproduce current behavior → write failing regression test → change service/domain code → keep controller contract compatible → update consumers | Regression test, boundary/invalid-state tests, package checks |
| New API or contract field | Define request/response/error semantics in `packages/api-contract` → validate DTO → capability and scope enforcement → controller/service → update all consumers | Contract/type checks, valid request, validation failure, `401`/`403`, consumer checks |
| Database/schema change | Inspect entities and prior migrations → write forward-only migration → make services tolerate existing rows → test upgraded populated fixture → document recovery implications | Fresh migration, populated-upgrade rehearsal, constraints/uniqueness, backup/restore rehearsal |
| Admin UI/UX | Reuse the shared primitives/tokens → add route/navigation capability metadata → feature API adapter → page states → focused tests | Typecheck, component/a11y tests, desktop and narrow RTL keyboard walkthrough |
| Shared CMB/architecture change | Identify real consumers and public entrypoint → preserve downward dependency direction → update workspace/architecture rules only when necessary | Architecture, compatibility, contract, affected-project and full workspace checks |
| Deployment/configuration change | Keep secrets outside Git → make local/CI/production behavior explicit → update Compose/workflow/runbook together | YAML/shell/config validation, disposable release rehearsal, review of security and rollback path |

### New backend logic and APIs

Search for the closest product module and extend it instead of making a parallel feature path. Put business decisions in a service; controllers should adapt HTTP and declare the capability requirement. Validate untrusted input with the established DTO/schema pattern. Treat IDs from the route or body as untrusted until the server has checked the authenticated user's organization, membership, student relationship, and capability.

Design writes for retries and concurrent requests: use a transaction when one logical action changes multiple records, enforce database constraints where an invariant is durable, and use a request ID, unique key, or expected revision when duplicate/subsequent submissions would be harmful. Return stable machine-readable error codes; do not make UI code depend on a human message.

Before changing a shared response, inspect every consumer. Prefer additive optional fields and new routes. Renaming/removing fields, tightening accepted input, or changing meaning is a breaking API change and requires a version/deprecation plan—not a silent edit.

### Database migrations without release surprises

Migrations must be forward-only, deterministic, bounded, and compatible with real existing rows. Do not use automatic schema synchronization. Never edit a migration that may already have run outside a disposable branch.

For every migration, answer these questions in the PR:

1. Can the previous application version read the new schema during rollout?
2. Can the new application version safely read incomplete/defaulted legacy rows?
3. Are indexes, foreign keys, uniqueness, nullability, and backfill size safe for the existing database?
4. Does the migration preserve data in a populated upgrade rehearsal and a backup/restore rehearsal?
5. What is the recovery action if it fails after applying—code correction, deliberate data repair, or restore from the pre-deploy backup?

Run `npm --prefix apps/api run migration:run` only on local/disposable databases during development. CI's `verify-release.sh` already exercises a populated upgrade and recovery script; extend its fixtures/tests when a migration adds a failure mode it cannot see. Never use production seed/reset commands as a deployment repair technique.

### UI and UX that remain usable in production

Reuse `apps/admin/src/shared/ui` and existing feature patterns before introducing a new primitive. Keep one capability-aware page/data flow across desktop and mobile shells; do not fork the feature by device. Use logical CSS properties and test mixed Persian/Latin content in RTL and LTR where supported.

Every interactive change needs:

- a semantic label, accessible name, visible focus state, keyboard path, and sensible focus return from dialogs;
- loading, empty, error, retry, permission-denied, read-only, and disabled states with specific next steps;
- validation adjacent to the field and an announced summary/status where appropriate;
- destructive-action scope, confirmation, progress, success, and recoverable failure behavior;
- responsive layout and touch targets on a real narrow viewport; and
- reduced-motion-safe behavior; decorative effects must not be required to use the workflow.

The layout owns one natural page-content vertical scroll area. Ordinary data tables should preserve horizontal overflow rather than creating nested vertical scroll traps. Do not rely on hover-only controls or color alone to communicate state.

### Make the change reviewable

Keep one feature vertically complete: contract, server authorization, persistence, UI consumer, tests, and current operational documentation together. Do not combine unrelated refactors, generated output, secret/config changes, or broad formatting with it. Include a brief PR test plan with exact commands and manual scenarios, then attach screenshots/video only for the states actually inspected.

## 6. Test before a pull request

Run the smallest relevant test before and after the change, then expand validation based on impact. A green command proves only the layer it exercises.

| Change | Required automated checks |
| --- | --- |
| API/module/migration | `npm --prefix apps/api run lint`, `npm --prefix apps/api test`, `npm --prefix apps/api run build` |
| Admin UI | `npm --prefix apps/admin run typecheck`, `format:check`, `lint`, `test`, `test:a11y`, and `build` |
| Student core | `npm --prefix student-core run build` and `npm --prefix student-core test` |
| Shared contracts/CMB/repository structure | `npm run workspace:check`, `npm run architecture:check`, `npm run contracts:check`, `npm run cmb:compatibility`, then `npm run verify` |
| Full release candidate | `npm run test:all` and `./scripts/deploy/verify-release.sh` where Docker is available |

Use the exact commands below for a broad repository verification:

```bash
npm run docs:check
npm run workspace:check
npm run workspace:list
npm run workspace:plan -- build
npm run bootstrap
npm run architecture:check
npm run architecture:self-test
npm run contracts:check
npm run cmb:compatibility
npm run test:generators
npm run test:cmb-publish
npm run verify
./scripts/deploy/verify-security.sh
npm --prefix apps/admin run audit:parity
npm --prefix apps/admin run test:coverage
npm --prefix apps/admin run test:e2e -- --list
```

For the Admin browser suite, install Chromium once in that leaf project, then run the intended tests:

```bash
npm --prefix apps/admin exec -- playwright install --with-deps chromium
npm --prefix apps/admin run test:e2e -- --grep 'desktop panels remain reachable'
```

Run `git diff --check`, review the diff and status, and ensure only intended paths will be committed:

```bash
git diff --check
git diff --stat
git status --short
```

### Manual quality checks CI cannot replace

Exercise the changed flow in a real browser at desktop and narrow/mobile widths: login/logout, role and organization switching, authorized success, unauthorized denial, validation errors, retry/idempotency, loading/empty/error states, keyboard-only navigation, focus trapping in dialogs, RTL/Persian text, and responsive tables/forms. Use realistic non-production data.

If the change involves external providers (SMS, Web Push, PWA installability, storage), verify it with authorized non-production credentials and the intended device/browser. Automated source, unit, build, and container checks do not prove device behavior, provider delivery, public DNS/TLS, or production state.

## 7. Understand the release rehearsal

`./scripts/deploy/verify-release.sh` is a disposable, local/CI production rehearsal. It does **not** read production configuration or data. It:

1. builds SHA-tagged API and Admin images;
2. prepares an old-to-new SQLite upgrade fixture and rehearses backup/restore;
3. starts an isolated TLS-enabled Compose stack;
4. probes `/ready`, `/health`, SPA delivery, OpenAPI, the API proxy, HTTPS redirect, and unauthenticated access;
5. checks production cookie settings, seeds a disposable security fixture, and executes critical login, authorization, attendance-idempotency, dormitory, and schedule smoke flows;
6. takes and restores a second database snapshot; and
7. emits a checked image archive in CI.

It requires Docker and may build images/download base layers. Its cleanup removes only its uniquely named disposable Compose resources. Never point it at a remote host or production database.

## 8. Pull request and protected promotion

Commit only the task files, then use the repository helper:

```bash
git add <intended-paths>
git commit -m "feat: concise description"
./scripts/cicd/finish-work.sh
```

The helper pushes the feature branch, creates/reuses a PR to `develop`, waits for the required `CI Gate`, and asks GitHub to merge only the tested head SHA. GitHub branch protection and required reviews remain authoritative. Ordinary feature PRs are squash-merged to `develop`; do not manually merge merely because a job has started.

`Continuous Integration` runs on PRs to and pushes on `develop` and `main`. It executes documentation/workspace/architecture/contract/CMB checks, bootstraps leaf lockfiles, verifies all projects, runs security and Admin coverage/browser checks, audits production dependencies, runs tooling tests, and invokes the container readiness workflow. `CI Gate` is successful only when both quality and container jobs succeed.

After a successful push to `develop`, `Release promotion` opens or updates the single `develop` → `main` PR. Review its complete diff and checks. Merge it using **Create a merge commit**; keep `develop` and do not squash or delete it. A successful main CI subsequently opens a synchronization PR back to `develop` to preserve ancestry.

## 9. Production deployment and proof

Production is the LAN Compose deployment controlled by the private `Mobin-Karam/bastak-school-deploy` repository. It serves `apps/admin` and the API; the Admin proxies `/api/v2`. The source repository never gives PR CI access to production credentials or the privileged runner.

Only a successful **push** CI on the current `main` SHA and `PRODUCTION_DEPLOY_TARGET=lan` triggers `LAN Production Deployment`. That workflow sends a `verified-main` dispatch containing the SHA and source CI run ID to the private repository. The dispatch is only a request—not evidence that production is healthy.

The private receiver independently validates the source run and exact SHA. The current source template downloads the exact CI image archive, verifies its checksum, revision label and image identity, rehearses the candidate migration against a restored SQLite copy, then starts those verified images with `--no-build --pull never`. It creates a consistent SQLite backup and checks HTTPS readiness. Credentials, certificates, production environment values, backup storage, deployment lock, and release receipt are kept outside the repository. Confirm that this template was actually published to the private receiver and that `IMMUTABLE_DEPLOY_ENABLED=true` was deliberately approved before relying on that behavior.

After a release, confirm all of the following before declaring deployment complete:

- the `develop` → `main` release PR merged with a merge commit;
- `Continuous Integration` and `CI Gate` passed for the exact main SHA;
- the source `LAN Production Deployment` authorization/dispatch run passed;
- the private `Server production deployment` receiver run passed for that SHA;
- production `/ready` returns `{ "ok": true }` over trusted HTTPS;
- login, role/organization switch, and one real authorized workflow work in the deployed application; and
- the server release receipt and backup are present, with no unexpected container/log error.

For local server/operator access, see [LAN production](../../deployment/lan/README.md). The required production `production.env` and TLS files are outside Git. Do not paste their values into issues, chat, commands, or documentation.

## 10. Prevent deployment failures

Most failed deployments are detectable before release. Treat this as a required preflight, in addition to—not instead of—CI:

1. **Start from current `develop`.** Confirm the branch, clean intended diff, and no unresolved conflict markers: `git status --short`, `git diff --check`, and a focused review of staged paths.
2. **Match the right validation to the change.** Run focused tests first, then all applicable package/repository checks in section 6. Use the CI Node version for lockfile-sensitive dependency changes; a local npm version can miss a lockfile problem that CI catches.
3. **Protect production data.** Validate migrations against fresh and populated disposable SQLite fixtures, retain the automatically created pre-deploy backup, and prove restoration. No production seeding, volume deletion, direct schema edits, or blind migration retries.
4. **Prove deployability.** Run `./scripts/deploy/verify-release.sh` when Docker is available for API, Admin, migration, Dockerfile, Compose, proxy, TLS, security-cookie, or deployment-script changes. It catches image build, Compose, readiness, proxy, HTTPS, and recovery failures before production.
5. **Protect contracts and access.** Test valid input, invalid input, unauthenticated access, unauthorized capability, cross-organization/student access, and repeat/concurrent writes. Confirm the UI uses `/me/context`, but remember that server guards are the authority.
6. **Protect the user experience.** Exercise the changed journey with the intended role on desktop and narrow/mobile widths, keyboard-only navigation, RTL, network/error behavior, and any affected external provider in a safe environment.
7. **Keep release configuration consistent.** Any change to Docker, Compose, proxy, environment variables, workflow, or deployment scripts needs a matching source update, documentation update, and a reviewed rollback/recovery plan. Never place production secrets in tracked environment files.
8. **Let protected CI decide.** Fix failures on the feature branch or through `develop`; do not override required checks, merge a stale head SHA, or bypass the release PR because a local command passed.

For every deployment-related change, also check the production-only boundary that the disposable rehearsal cannot know:

- Run `docker compose ... config --quiet` with only non-secret placeholder values for every Compose profile you changed. Required variables such as `CORS_ORIGINS` and disposable `CI_TLS_DIR` must be supplied; never make them optional merely to silence config validation.
- Keep `docker-compose.production.yml` free of `build:` at runtime by applying `deployment/lan/immutable.yml`; the receiver must use the archived content IDs, not `latest` tags or a host rebuild.
- Preserve the external SQLite volume name, `/data` mount, host UID permissions, TLS paths and the existing-stack precondition. The immutable deployment intentionally refuses bootstrap, unknown volumes, expired certificates and a concurrent lock.
- Update both the source receiver template and the separately maintained private workflow, then verify the published private revision before release. Editing this repository alone cannot change the private deployment repository.
- Treat a source dispatch, a successful image artifact upload, and `/ready` as separate evidence. A healthy release requires all three plus the private receiver success, receipt/backup, and an authorized production smoke.

Use this compact PR preflight record:

```text
Outcome and roles/capabilities:
Data/API/migration impact:
Rollback or recovery impact:
Automated checks run (exact commands):
Manual browser/device/provider checks run:
Not verified and why:
```

## 11. Failure, rollback, and recovery rules

Stop at the first failed stage and inspect its logs and the exact SHA. Do not bypass failed checks, force a merge, reseed production, delete `/data`, run `docker compose down --volumes`, or rerun migrations blindly.

- **Feature PR fails:** fix on the branch, add/adjust focused tests, push, and let the PR checks rerun.
- **Release PR fails:** fix through `develop`, wait for its push CI, then review the updated release PR. Do not patch `main` directly.
- **Source dispatch passes but production is unhealthy:** inspect the private receiver run and live readiness; source dispatch success alone is insufficient.
- **Private receiver cannot download/verify the bundle:** check the source CI run ID/SHA, unexpired `production-images-<sha>` artifact, `SOURCE_ARTIFACT_READ_TOKEN`, protected environment approval, and the receiver's Docker platform. Do not rebuild the image on the host or substitute a tag.
- **Candidate stops after migrations:** keep ingress stopped, preserve the backup and logs, and assess schema/data state. Do not restart the old application against a potentially migrated volume without a compatible-image rehearsal.
- **Application regression:** make a reviewed `fix/` revert from `develop` and follow the same release path. Code rollback does not roll back schema or data.
- **Migration/data incident:** preserve the pre-deploy backup, stop and assess schema/data state, then follow [database rollout](./database-multi-role-integrity-rollout.md). Restore is a deliberate operation after reviewing writes since the backup; it is not automatic.

The deployment is a single-server, single-API-replica SQLite system. It can incur restart downtime and has no automatic database restore or blind rollback. Keep off-server backups under an explicit retention policy and periodically rehearse restoration using disposable copies.

## 12. Definition of done

Before closing work, record what was actually run and what remains unverified. A complete change has:

- source, API contracts, authorization, scope, migration, and consumers traced where relevant;
- regression coverage for bugs where practical;
- affected automated checks passed;
- a reviewed diff with no accidental generated files or secrets;
- manual browser/device/provider checks appropriate to the feature;
- a protected PR and CI evidence for releases; and
- post-release private receiver, HTTPS readiness, and real authorized-flow evidence for production.

Never represent a local build, a green source CI run, or a successful dispatch as proof of production health.
