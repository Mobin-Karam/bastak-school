# Reliability, test plan and production incidents

2026-10-13. Small-server profile: one API writer on persistent SQLite, Nginx TLS, rotating Docker logs, no new public metrics port or external observability service. Baselines below are measured, not promised capacity. [Security audit](../security/application-security-audit.md), [database plan](../architecture/database-migration-plan.md) and [deployment audit](deployment-audit.md) explain existing risks.

## Executable validation and fixture ownership

Use Node 22.23.3 and leaf package locks. Bootstrap once with `npm run bootstrap`; never install root workspace dependencies incidentally.

```bash
bash scripts/operations/verify-reliability.sh all
# Rerun just the bounded, disposable benchmark:
bash scripts/operations/verify-reliability.sh baseline
# Read-only server observations; no raw logs or Docker environment output:
python3 scripts/operations/collect-reliability.py
```

The complete plan checks workspace/dependency boundaries/contracts/CMB compatibility, component lint/typecheck/unit/integration/a11y/build scripts, three existing network E2E suites and the optional benchmark. CI already requires those component/contract/E2E checks; the new security and observability specs run in normal API `npm test`. Performance distributions are advisory because hosted machines vary. Benchmark correctness (successful requests and unique attendance rows) is asserted; no flaky fixed latency assertion is added to ordinary CI. HTTPS container smoke remains in `scripts/deploy/verify-release.sh` and `smoke-critical.mjs`.

| Layer | What it proves | Fixtures / command |
| --- | --- | --- |
| Unit | Capability/workflow transitions, throttle behavior, projection and logging safety | `apps/api/test/*.spec.ts`, shared CMB public entrypoint tests; npm verify |
| Database integration | Fresh migrations, uniqueness/concurrent writes, transactional failure, record preservation and restore comparison | `database-persistence-integration.spec.ts`, `database-multi-role-regression.spec.ts`; fresh OS-temp SQLite/WAL, foreign keys ON, synchronize false |
| HTTP integration | Real Nest composition, guards, cookies, CSRF, DTOs and object ownership | `security-boundaries.integration.spec.ts`; migrated isolated SQLite, synthetic users and schools; Fastify inject, no socket |
| API contract | Admin/API/student-core transport compatibility and public package ownership | npm run contracts:check; component consumer typechecks |
| Network E2E | Login, work context, student records, classes, attendance, dormitory, schedule and denied administration | scripts/deploy/verify-security.sh seeds separate mktemp databases and binds a local test port; never production config |
| HTTPS/image E2E | Tested Docker identities, TLS/proxy, workflow smoke and persistent mounts | scripts/deploy/verify-release.sh; isolated Compose project/volumes |
| Bounded load | Listing/dashboard concurrency and repeated attendance writes with database uniqueness | performance-baseline.spec.ts; 1,000 synthetic students, 30 class participants, five warmups and 40 measured calls per scenario, concurrency four; no configurable external URL |

Temporary fixture roots are owned by the test and removed on teardown. Database env overrides are restored. Real production records are neither copied into load fixtures nor printed. Synthetic benchmark CPU/RSS includes Jest/TypeScript/Nest in-process overhead; compare production container measurements separately. Fixtures currently have empty academic history, no network/push traffic and one school; extend to realistic historical datasets and 2/4/8 concurrency in an isolated staging server before making scaling decisions.

Local release evidence: `npm run verify` passed all workspace component gates (421 API tests, 512 Admin tests, 6 Admin accessibility tests, 10 student-core tests and reusable package/reference tests), with three opt-in benchmark cases skipped in ordinary test runs. All three network E2E suites passed separately. The opt-in performance run passed all three measured scenarios. Documentation, architecture, API contracts, CMB compatibility/generator/publish fixtures and 22 CI/deployment/recovery tests passed. The candidate Docker image successfully rehearsed pending migrations on the verified restored production snapshot with existing records preserved; the prior image then read student/session schemas on that upgraded copy. GitHub and actual deployment results are recorded in the release receipt/report, not inferred from local success.

## Critical workflows and failure modes

| Workflow | Main failure modes | Detection / safeguard |
| --- | --- | --- |
| Login/refresh/context switch | Expired or disabled sessions, token rotation race, wrong role/school, stale frontend context | Auth unit tests, one-winner refresh integration, forged/revoked context tests, 401/403 rates; frontend refresh coordination |
| Signup/registration | Duplicate phone/national code, partial profile/contact writes, school quota, ambiguous legacy ownership | Unique constraints and migration-backed fixtures; onboarding journey; transactional/ownership gaps tracked in security/database audit |
| Student and guardian records | Object-ID guessing, relationship/membership revocation, credential projections | Real two-school negative reads/writes, unchanged-record assertions and allowlisted user projection |
| Classes/dormitories | Foreign-school participants, over-capacity or duplicate placement | Negative roster updates, persistence constraints/atomic room allocation, class/dorm smoke |
| Attendance | Duplicate requests, stale revision, concurrent writers, invalid participant, partial batch, event delivery failure | Disposable concurrent submissions, receipt/revision tests, unique session/student constraints, transactional writes; persisted rows are authority |
| Schedules/dashboards | Cross-school reads, unbounded lists/queries, stale caches, many historical records | Scoped integration tests, per-scenario query/latency baseline; pagination/query aggregation follow-up |
| Deployment/recovery | Wrong image, expired TLS, unavailable DB/volume, unsafe migration, stale backup, failed startup | Retained image IDs, restore comparison, isolated migration rehearsal, Compose/HTTPS readiness, host lock and release receipt |

## Measurements and initial budgets

[Baseline JSON](reliability-baseline.json) records the successful local run. It measures API handlers via Fastify injection, including authentication/authorization and SQLite work, excluding TLS/network/browser rendering. Forty samples are insufficient for a stable long-tail SLO. p99 is reported as an lower-order empirical percentile, not a guarantee.

| Scenario (concurrency 4) | p50 / p95 / p99 ms | Queries/request | Query p95 / max ms | Error rate |
| --- | --- | --- | --- | --- |
| 1,000-student listing | 427.40 / 526.84 / 526.85 | 9 | 24 / 40 | 0 server errors; all 200 |
| Staff dashboard | 55.94 / 70.93 / 70.93 | 30 | 3 / 6 | 0 server errors; all 200 |
| Attendance batch, 30 participants | 313.61 / 362.67 / 375.73 | 174 | 1 / 3 | 0 server errors; all 201; exactly 30 persisted records |

There is **no claimed optimization or before/after speedup**. These are baseline measurements after correctness fixes. Query durations use TypeORM afterQuery events; millisecond resolution yields zeros for short statements. Listing hydration/serialization and numerous attendance statements are observed candidates, not proof that a specific index will help. Existing database EXPLAIN/timing evidence remains in the database audit.

Initial investigation budgets for this same fixture: listing p95 <=750 ms, dashboard <=250 ms, attendance batch <=750 ms, zero 5xx and duplicate attendance records. Repeated runs above budget or >25% regression justify profiling; budgets do not reject a release from one noisy sample. Production initial alert policy: five-minute 5xx >1% with at least 100 requests, p95 >1 second for two consecutive windows (separate route families), readiness fails three polls, unexpected restart increase, RAM available <15%, disk usage >80% warning/>90% urgent, or free disk <5 GiB. CPU >80% of available cores sustained ten minutes should trigger investigation; one point is not saturation. Database query >100 ms generates a safe slow-query event; repeated slow events warrant EXPLAIN on a disposable/restored copy.

[Before-release host snapshot](reliability-host-before.json) measured four CPU cores, about 9.6 GiB total RAM, 6.0 GiB available, 194 GiB disk free, CPU load 0.18, healthy containers and zero restarts. Old API memory was about 160 MiB; Admin about 14 MiB. Old request logs did not have the new event format, so latency/error rate were unavailable rather than reported as zero. After deployment, the collector will populate those fields. Docker CPU/memory are snapshots; disk covers the shared host filesystem. Restart counters reset on container recreation, so keep prior receipts and snapshot history.

## Lightweight observability

`common/observability/http-telemetry.ts` emits one JSON completion record per response, including guard failures: UTC timestamp, validated UUID requestId, method, route template, status and durationMs. `X-Request-ID` is returned and error envelopes include the same ID. Invalid/client-text IDs are replaced with a generated UUID. Route templates keep names, IDs, query strings and credentials out of logs. Bodies, headers, exception messages and responses are not logged. Long-lived SSE duration is connection lifetime and must be excluded from ordinary request latency alerts.

`database/safe-database-logger.ts` emits only db.query.slow duration and db.query.error event; no SQL, bind values or driver messages. Production slow-query logs cover the tail, not a complete query histogram. The disposable baseline measures all statement durations. Full production query histograms/traces are a follow-up if tail events and handler metrics cannot isolate an incident; avoid per-statement logging on this SQLite server.

The read-only collector bounds Docker log reads to five minutes/5,000 lines and prints only aggregate metrics plus CPU, RAM, disk and restart/health/image identity. Docker events can be examined privately for the recreation history. Log tail truncation means rates are sample rates; collect more frequently if traffic reaches the cap. Exclude health/readiness and SSE from business-route SLOs. `/health` reports process liveness; `/ready` probes modules and SELECT 1 against SQLite, returning sanitized 503 on failure. These endpoints neither validate every migration nor prove a writable disk or business workflow. Persistent storage still needs free-space and restore checks.

Start with private-server polling and existing operator alert channels. Run the collector manually or from a reviewed user-systemd timer; retain restricted snapshots and alert on the budgets above. No alert destination or new background timer was installed automatically. Monitoring stack, public scrape endpoint, Prometheus/Grafana and external log shipping are deliberately not required for this host.

## Prioritized improvements

1. **P1, small, delivered:** regressions for credential disclosure, cross-school guardian/chat/data feeds, refresh races, logout CSRF; safe request/SQL logs and correlation; retained-image receipts and restore/migration rehearsal. Deployment gates remain authoritative.
2. **P1, medium:** stage concrete DTOs for workflow/import inputs and security audit events. Coordinate with Admin contracts before tightening input handling; see security audit. Never log private before/after student values.
3. **P2, medium:** paginate student listings with a compatible new cursor contract and migrate Admin consumers; profile hydration/serialization separately from SQL. Current 1,000-record list p95 ~527 ms and 9 queries/request provide a baseline. Do not replace the existing array response in place.
4. **P2, medium:** measure bulk attendance phases and statement counts (174/request for 30 participants), then consider a bounded upsert inside the existing revision/receipt transaction. Preserve actor/context/participant validation, audits and idempotency. Benchmark old/new paths on identical fixtures before claiming improvement.
5. **P2, medium:** expand fixtures with several terms of attendance/plans, two schools and dashboard work queues; measure per-tenant query plans, SQLITE_BUSY and event-loop delay. Single-replica SQLite is an explicit current operating limit. PostgreSQL migration remains a separately rehearsed strategy, not an incidental optimization.
6. **P2, small:** automate private health/disk/backup-age/restore-age checks with an agreed alert recipient and retention budget; add slow-query and disk-full drills. Keep log sampling and monitor freshness visible.

## Minimal incident response and retained-image rollback

1. Record UTC time, affected workflow, request ID and current release/image IDs. Pause new deployment attempts; acquire the existing host deployment lock. Never print production.env, cookies, tokens or private student payloads.
2. Check `/health` and HTTPS `/ready`, container health/restarts, disk free space and the safe collector. If database/migration integrity is uncertain, stop ingress/writes and preserve the live volume and backups. Do not prune images/volumes, reset data or rerun seeds.
3. Examine route/status/duration events around correlation IDs. Check recent deployment receipt, backup restoration verification and migration difference. Expected 401/403/409 are not 5xx availability incidents. If TLS/proxy failed, verify Nginx config/certificate dates without disclosing keys.
4. For a compatible code regression, use the retained **exact image IDs/tags** and existing production storage. For a schema/data incident, assess compatibility on a restored copy before reverting code. Never blindly migration:revert or restore an older snapshot over newer records. Obtain a reconciliation plan for writes since the backup.
5. Verify running image identities, persistent volume, Nginx syntax, HTTPS readiness and a read-only authenticated workflow check with an authorized operator. Record resolution and a new regression; resume deploys only after a clean gate.

The legacy deploy builds before downtime, then stops ingress and the sole SQLite writer, verifies the final stopped snapshot/restoration and rehearses migrations. Preflight failure restarts the unchanged containers; failure after replacement stops ingress for compatibility assessment. No database is restored automatically.

`scripts/deploy/retain-current-images.py` tags existing API and Admin images **before a legacy build/recreation** and writes a restricted `images.json` plus `compose.rollback.yml` in `~/.config/bastak-production/releases/rollback-<UTC>`. It never deletes images. The initial retained release for this work is `rollback-20261013T023132Z`. Both image identities and backup are operator-private; tagged images remain locally available. No image/system prune is part of the deployment.

After migration compatibility review, an operator can recreate with the old images using the production Compose files and that final override:

```bash
# Run from the deployment checkout with its existing approved configuration/TLS.
# Set rollback_directory to the selected receipt directory; inspect images.json first.
docker compose --env-file .run/production/production.env \
  -f docker-compose.production.yml -f deployment/lan/compose.yml \
  -f "$rollback_directory/compose.rollback.yml" \
  up -d --no-build --pull never --wait --wait-timeout 180
```

Take and verify another backup before rollback; use the deployment lock and leave the named database volume intact. The legacy deployment now labels and tags newly built images with the full release commit and checks exact running image IDs. It still builds on the private server; the separately staged CI-artifact deployment path remains unactivated. This command changes images only and does not undo migrations or newer data. The current integrated release includes the previous additive persistence-index/constraint migration; confirm the old image accepts those constraints before rollback. Keep rollback images through an agreed observation period and until you explicitly retire them. Manual archive/off-host backup retention is still an operator policy; no old image or production backup is removed here.
