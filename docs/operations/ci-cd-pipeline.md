# CI/CD pipeline: from change to production

This page is the current pipeline map for `Mobin-Karam/bastak-school`, verified against workflow and script files on 2026-10-18. [GitHub CI/CD operations](./github-cicd.md) owns setup, credentials and recovery commands; [release evidence](./release-evidence.md) owns environment-specific sign-off. The [engineering roadmap](../engineering/roadmap.md) separates proposed improvements from implemented gates.

```text
feat/fix/chore/ci branch from origin/develop
       │ PR to develop
       ▼
Continuous Integration ── quality + containers ──► CI Gate
       │ successful merge to develop
       ▼
Develop push CI ──► Release promotion opens/updates develop → main PR
       │ release review + exact develop evidence gate + merge commit
       ▼
Main push CI ──► LAN Production Deployment verifies current tested SHA
       │ verified-main dispatch
       ▼
Private deployment repo verifies source CI again
       │ self-hosted runner: verify image bundle → SQLite backup/rehearsal → replace → HTTPS readiness
       ▼
Release receipt; operator checks target behavior and monitoring
```

A source workflow accepting a dispatch means the request was sent. Production success requires the private server workflow, readiness check and operational smoke evidence. The diagram does not imply a staging environment or zero-downtime deployment; neither is implemented as a required pipeline stage.

## Branch and review contract

Use [`start-work.sh`](../../scripts/cicd/start-work.sh) to fetch `origin/develop` and create an isolated `feat/`, `fix/`, `chore/` or `ci/` branch. If the checkout is dirty, pass a separate worktree path. Commit only task files. [`finish-work.sh`](../../scripts/cicd/finish-work.sh) pushes, opens the develop PR, waits for `CI Gate` and attempts a protected squash merge of the exact head commit. GitHub branch protection and configured reviews still decide whether it may merge. It never force-pushes or bypasses a failed gate.

`develop` is the integration branch; `main` is the reviewed release branch. After a successful develop **push** CI run, [Release promotion](../../.github/workflows/release-promotion.yml) creates or updates a `develop` → `main` PR only when the tested SHA is still current and the application diff is nonempty. A release reviewer inspects the entire diff and merges with a merge commit after required checks. The release PR is not auto-merged. Main CI then opens a checked merge-commit synchronization PR back to develop when needed, preserving ancestry.

## Required source CI gate

[Continuous Integration](../../.github/workflows/continuous-integration.yml) runs on every PR to `develop` or `main`, every push to those branches, and manual dispatch. It has no path filter. Feature PRs, branch pushes, and manual runs require both `quality` and `containers`. A `develop` → `main` release PR instead uses `promotion-evidence`: it requires the exact current develop SHA, main ancestry, a successful completed develop-push CI run for that SHA, and exactly one unexpired image bundle with a GitHub artifact digest. `CI Gate` uses `always()` and accepts exactly one of those two paths; skipped, cancelled, ambiguous, expired, or failed evidence fails the gate.

| Job or stage | Actual checks | Scope |
| --- | --- | --- |
| Quality setup | docs links/ownership, workspace DAG/list/build plan, leaf-lockfile bootstrap | Whole repository |
| Architecture and contracts | boundary check and self-test, shared API contract, CMB compatibility | Cross-project contracts |
| Package verification | generator and CMB publishing tests, workspace `verify` scripts in dependency order | CMB, API, Admin, student-core |
| API journey | Security matrix, student exam and onboarding journeys, each with disposable SQLite | Auth, scope and selected workflows |
| Admin quality | Parity audit, Vitest coverage, Playwright discovery and desktop layout Chromium run | UI behavior and layout |
| Supply chain and pipeline | Production-dependency audit for Admin and API; Python pipeline tests | Dependencies and workflow invariants |
| Containers | Build commit-tagged topology, authenticate critical workflows on disposable HTTPS, and verify proxy/cookies/restore/migrations | Deployment shape |
| Promotion evidence | On release PRs only, verify exact successful develop-push CI and its immutable image artifact instead of repeating the same source and container work | Release provenance |

`npm run verify` delegates to [`tooling/workspace/projects.json`](../../tooling/workspace/projects.json); project scripts remain authoritative. CI skips only `admin-v2:test` inside that pass because the subsequent `admin-v2 test:coverage` command executes the same complete Vitest suite with coverage enabled. The Admin typecheck, format, lint, accessibility and build tasks, plus every other project's tasks, remain in workspace verification. The standalone [backend quality](../../.github/workflows/backend-v2-quality.yml) workflow also applies every migration to a fresh database. Path-filtered component workflows provide extra feedback on develop PRs and the integrated develop push; they do not repeat on the release PR or main push and do not replace the unfiltered `CI Gate`.

Image archives are created and uploaded only for successful `develop` or `main` push qualification. PR container rehearsals still build and test the exact PR images, but skip the roughly 512 MB Docker archive because no deployment consumes it. The CI browser run exercises shipped desktop layout in RTL and LTR. Authenticated school workflows now run through the actual HTTPS container stack; account-based browser login and planner drag still need a separate seeded browser fixture and are not part of the required gate. A browser layout pass is not proof of all roles or mobile flows. The [testing strategy](../engineering/testing-strategy.md) records priority gaps.

## Local reproduction

Run the repository checks in workspace order. Node 22.23.3 is used in CI; dependencies are installed in leaf projects, not through a root workspace lockfile.

```bash
npm run docs:check
npm run workspace:check
npm run workspace:list
npm run workspace:plan -- build
npm run bootstrap
npm run architecture:check
npm run contracts:check
npm run verify
./scripts/deploy/verify-security.sh
```

`npm run test:all` adds generator/publishing tests, Admin coverage, browser layout and Python pipeline tests. Install Playwright Chromium and PyYAML 6.0.2 in the local environment first. Use `node tooling/workspace/run.mjs verify --project=admin-v2` for a project and its local dependencies; use `node tooling/workspace/run.mjs verify --affected --base=origin/develop --head=HEAD --dry-run` to preview impacted validation, then rely on full required CI for merge. Do not point journey scripts at production or a persistent local database.

## Release and deployment trust boundary

On a successful main **push** CI run, [LAN Production Deployment](../../.github/workflows/lan-production.yml) checks the CI event, branch, source repository, conclusion and current main SHA. It sends a `verified-main` dispatch with the tested SHA and run ID using a token scoped to the private deployment repository. The private [server workflow source](../../.github/deployment/server-deploy.yml) independently verifies that exact source CI run and current main head. Only then does its private self-hosted runner check out that SHA.

The source template's [`lan-immutable.sh`](../../scripts/deploy/lan-immutable.sh) obtains a deployment lock, downloads the exact CI archive, verifies its provenance/checksum/image IDs, backs up the running SQLite database with restricted permissions, rehearses candidate migrations against a restored copy, replaces containers without a build or pull, and checks `/ready` over HTTPS. Production startup applies migrations; seeds are not part of deployment. The receipt is written only after the script returns successfully. The backup, TLS files, environment and receipt live outside checkout cleanup. There is one API replica with SQLite; deployment can involve restart downtime.

The immutable receiver is enabled only when the private repository has published the source template, configured its protected `production` environment and explicitly set `IMMUTABLE_DEPLOY_ENABLED=true`. Verify that external state for every release; this repository cannot prove it. Until then, the private receiver's actual behavior is **UNKNOWN** and must not be represented as CI-tested image promotion. See the [archived deployment audit](../archive/operations/deployment-audit.md) and [immutable LAN runbook](./immutable-lan-runbook.md). A registry is not required for the immutable artifact transport. Similarly, a required staging environment and load-test gate are proposals, not current stages.

## Failure and recovery

| Failure point | What to inspect | Safe next action |
| --- | --- | --- |
| PR check | First failed job and exact command | Fix on branch, rerun tests, let new commit recheck |
| Missing CI Gate | Workflow trigger, job prerequisites and Actions permissions | Confirm unfiltered CI ran; do not bypass protection |
| Develop release PR | Tested SHA vs current develop, empty diff, `RELEASE_PR_TOKEN` | Rerun failed workflow after correcting scope or token |
| Main dispatch | Main head vs tested SHA, `PRODUCTION_DEPLOY_TARGET`, `DEPLOY_DISPATCH_TOKEN` | Verify source run and private dispatch status |
| Private authorization | Source run ID, SHA, branch, repo and workflow path | Reject mismatch; do not manually substitute another commit |
| Server deployment | Bundle provenance/identity, migration state, backup and HTTPS readiness | Stop further changes, preserve backup, diagnose before recovery |

A failed build should leave existing containers running. A failed replacement can leave some new containers running; inspect state before retrying. Reverting application code does not reverse SQLite schema/data changes. Rehearse restore against a disposable copy and follow the [database rollout](./database-multi-role-integrity-rollout.md) for migration-specific decisions. Never reset or seed production to repair a release. Confirm the private workflow, release receipt, readiness, login, role/school switch and one authorized operation before calling a production release healthy.

## Configuration and source files

| Responsibility | Source |
| --- | --- |
| Branch helpers | [`scripts/cicd`](../../scripts/cicd/finish-work.sh) |
| Required PR/push gate | [Continuous Integration](../../.github/workflows/continuous-integration.yml) |
| Disposable container smoke | [Deployment readiness](../../.github/workflows/deployment-readiness.yml) |
| Develop-to-main PR | [Release promotion](../../.github/workflows/release-promotion.yml) |
| Main authorization and dispatch | [LAN Production Deployment](../../.github/workflows/lan-production.yml) |
| Private server workflow template | [Server deployment](../../.github/deployment/server-deploy.yml) |
| Immutable production compose/backup/readiness | [`lan-immutable.sh`](../../scripts/deploy/lan-immutable.sh) |
| Tokens, runner registration and retries | [GitHub CI/CD operations](./github-cicd.md) |
