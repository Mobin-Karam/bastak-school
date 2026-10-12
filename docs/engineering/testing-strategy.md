# Testing strategy and release evidence

The goal is to protect behavior at the lowest useful level, then prove a few complete workflows. A passing unit test does not prove a browser session or a deployed recovery. The [CI/CD pipeline](../operations/ci-cd-pipeline.md) lists the actual required gates; the [release evidence checklist](../operations/release-evidence.md) separates automated, browser, native, push and restore evidence.

| Level | What it should prove | Current runner |
| --- | --- | --- |
| Unit and component | Business rules, validation, UI states, permission helpers | API Jest, Admin Vitest, CMB and student-core package tests through `npm run verify` |
| Database and integration | Migrations, constraints, service interactions and scoped persistence | API Jest suites, fresh migration run in [backend quality](../../.github/workflows/backend-v2-quality.yml) |
| API journey | Authentication, authorization, onboarding and student exam workflows against disposable SQLite | [`verify-security.sh`](../../scripts/deploy/verify-security.sh) |
| Accessibility | Representative Admin states and interactions | `npm --prefix apps/admin run test:a11y` |
| Browser layout | Shipped CSS at desktop sizes and both directions | Playwright layout tests in [continuous integration](../../.github/workflows/continuous-integration.yml) |
| Browser account journeys | Login, role/context, mutations, planner drag | Playwright tests under [`apps/admin/e2e`](../../apps/admin/e2e); seeded API/browser fixture required; some are opt-in |
| Deployment topology | TLS, proxy, migrations, readiness and secure cookies | [Deployment readiness](../../.github/workflows/deployment-readiness.yml) |

From the repository root, after bootstrapping dependencies in workspace order, run `npm run verify` for component validation and `npm run test:all` for the broader local sequence. `test:all` requires the Admin Playwright Chromium browser and Python PyYAML 6.0.2. For a focused API journey, build `apps/api` and run `./scripts/deploy/verify-security.sh student-journey` (or `security-matrix` or `onboarding-journey`). The script creates a separate temporary SQLite database for each suite and removes it afterward.

Every bug fix should get a test that fails on the original behavior when practical. For a changed route or DTO, cover the relevant Admin and student-facing consumers and a denied request. For database changes, test fresh migration, populated upgrade, uniqueness or foreign-key behavior, and rollback or restore assumptions. Do not weaken a test to make a new implementation green.

The following flows are priority regression candidates; this table is a plan, not a claim that each has a complete browser test today:

1. Student signup, profile and advisor assignment.
2. Principal changes class or organization scope without leaking records.
3. Teacher submits attendance; supervisor edits it; simultaneous writes preserve the database invariant.
4. Unauthorized users cannot access another student or organization.
5. Student reads their attendance, schedule and assigned assessment.
6. Existing rows remain valid after migrations and a tested backup restore.

Record exactly what ran and where. A local browser run, CI layout test, disposable API suite and production smoke test establish different kinds of evidence. The [release evidence checklist](../operations/release-evidence.md) lists the remaining environment-specific checks.
