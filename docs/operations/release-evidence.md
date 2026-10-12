# Release evidence and sign-off

Last reviewed: 2026-10-12. Evidence is layered: a passed source test, browser check, deployment smoke or production check proves only the behavior and environment it exercised. The [CI/CD pipeline](./ci-cd-pipeline.md) is the executable gate map; [GitHub operations](./github-cicd.md) covers promotion and recovery.

| Layer | Automated evidence in required CI | Evidence still needed for a release decision |
| --- | --- | --- |
| Repository and API | Architecture/contracts, API tests, disposable security/student-exam/onboarding journeys, fresh migration run in the backend quality workflow | Target configuration, representative authorized and denied actions |
| Admin and student-facing web | Unit, accessibility, coverage, build and desktop RTL/LTR layout checks | Seeded login, role/organization switch, critical mutations, mobile and target browsers |
| Deployment topology | Disposable production container build, TLS/proxy/migration/secure-cookie/readiness smoke | Private server deployment result, production readiness and authenticated operation |
| SQLite migration and recovery | Disposable migrations and pre-deploy backup mechanism | Upgrade rehearsal on a representative copy, verified restore and post-restore workflow |
| Push or native delivery | Source or package checks where present | HTTPS provider delivery, device install, offline/restart behavior if these surfaces are supported for this release |
| Performance | No required load-test or latency gate | Baseline workload, p95/error/resource evidence for changed hot paths |

The account-based Playwright smoke and planner drag suites under [`apps/admin/e2e`](../../apps/admin/e2e) require a seeded browser/API fixture and are not part of the required CI gate. The current standalone Student application is absent; student accounts use Admin views. Do not reuse old Student-app screenshots or route lists as current release evidence.

## Local API evidence

Build the API first, then run the disposable suite harness from the repository root:

```bash
npm --prefix apps/api run build
./scripts/deploy/verify-security.sh
# Or focus on one suite:
./scripts/deploy/verify-security.sh onboarding-journey
```

The script creates a temporary SQLite database for each suite, starts a local API, and cleans up afterward. It proves API behavior under test configuration, not browser rendering, production cookies, provider delivery or deployed recovery.

## Browser evidence

The required CI browser stage tests shipped desktop layout at RTL and LTR widths. For account workflows, run Playwright only against an isolated seeded API and Admin instance, using `ADMIN_V2_E2E_BASE_URL` and the fixture described by the test. Record the browser version, viewport, branch/SHA, test command and result. Do not set fixture flags against production. A skipped test is not a pass for its workflow.

For a student-facing change, include a mobile-width login and the affected task, schedule, attendance or exam flow, plus a role/context switch where relevant. For an Admin change, include allowed and denied action paths. Browser evidence should use the current shared Admin shell.

## Migration, backup and rollback evidence

Before a release with database changes, rehearse the migration chain against a disposable copy representative of existing data. Record the migration source SHA, preflight results, integrity and foreign-key checks, row invariants and application smoke after upgrade. Verify a restorable backup; a backup file alone does not prove recovery. Follow the [database integrity rollout](./database-multi-role-integrity-rollout.md) for the current migration's constraints.

The [production deploy script](../../scripts/deploy/lan.sh) builds before replacement and takes a restricted SQLite backup before recreating containers. It does not restore automatically. A failed replacement may leave mixed container state. A code revert does not reverse schema or data changes. Protect the backup, inspect migration state, and rehearse recovery on disposable data before any production restore.

## Production release record

A release can be called healthy only after the develop-to-main PR was reviewed and merged, main CI passed for the exact SHA, the source dispatch succeeded, the private deployment workflow authorized and deployed that SHA, HTTPS readiness passed, and an operator checked login, role/school switch and one real authorized operation. Record the SHA, run IDs, time, operator, smoke result, backup identifier and follow-up monitoring window without copying secrets or personal data into docs or issues. If any layer is missing, state it as unverified.
