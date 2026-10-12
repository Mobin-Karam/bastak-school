# Moshaver v2 repository runbook

This runbook describes the active checkout as verified on 2026-10-12. The runnable applications are `apps/api` and `apps/admin`; student accounts use the Admin application. `student-core` remains separately validated. The old standalone `apps/student` directory is absent. The root `docker-compose.yml` still refers to that missing directory, so it is not a reliable local-start command in this checkout. The release topology is described in the [CI/CD pipeline](./ci-cd-pipeline.md).

## Start local development

Use Node 22.23.3, install leaf dependencies, and give the API a disposable or explicitly chosen local SQLite path. Do not use the production database for development seeds.

```bash
npm --prefix apps/api ci
npm --prefix apps/admin ci
npm --prefix apps/api run dev
# Separate terminal:
npm --prefix apps/admin run dev
```

The API defaults to port 4000; Admin Vite uses port 8081 and proxies `/api/v2` to the configured local API. Check `http://localhost:4000/ready` for API readiness and `http://localhost:8081` for Admin, including student views. The [product demo seed guide](./backend-v2-product-demo-seed.md) explains seed variants and safeguards. Migrations run through the [API data source](../../apps/api/src/database/data-source.ts); `npm --prefix apps/api run migration:run` is available when an explicit migration run is needed.

## Repository-wide validation

The root manifest orchestrates projects without an npm `workspaces` field or unified root lockfile. Run the workspace checks before full verification:

```bash
npm run workspace:check
npm run workspace:list
npm run workspace:plan -- build
npm run bootstrap
npm run verify
```

`npm run bootstrap` installs each project from its own lockfile in dependency order. For one project and local dependencies use `node tooling/workspace/run.mjs verify --project=admin-v2`. `npm run test:all` adds generator/publishing, coverage, disposable API journeys, Playwright layout and Python pipeline tests; see the [testing strategy](../engineering/testing-strategy.md) for prerequisites and limits.

## Change verification matrix

| Change | Minimum evidence |
| --- | --- |
| API | Typecheck/lint, unit/integration tests, build, relevant contract/security journey and migration rehearsal if schema changed |
| Admin or student-facing Admin | Typecheck, format, lint, unit/accessibility tests, build, relevant browser check in RTL and narrow viewport |
| `student-core` | Build and package tests, plus consumer validation when public behavior changes |
| CI/CD or deployment | Pipeline tests, workflow review, disposable container smoke and recovery implications |
| Documentation | `npm run docs:check`, source-path review and `git diff --check -- docs` |

A successful repository CI gate is required for merging; local focused checks help shorten feedback. Browser, native, push, deployed and destructive-restore evidence are separate and must be reported honestly. The [release evidence guide](./release-evidence.md) lists target-environment checks.

## Access the v1.4 archive

The historical v1.4 tree is on `archive/v1.4`, pinned at `cf63c233bce116371519fef61c231143bbd902b1`. A separate worktree isolates it from v2:

```bash
git fetch origin archive/v1.4
git worktree add ../moshaver-v1.4 origin/archive/v1.4
```

Run legacy instructions in that worktree. Do not mix its API clients or SQLite data into the active v2 deployment.

## Data and deployment safety

Back up and verify data before migrations, imports or restore operations. Test destructive changes against disposable databases. Use [GitHub CI/CD operations](./github-cicd.md) for release and recovery; production startup applies migrations but not demo seeds. Never commit `.env` files, credentials, tokens or database files. The [feature and bug playbook](./feature-and-bug-playbook.md) and [maintenance guide](./maintenance-guide.md) cover implementation and recurring work.
