# Bastak School safe refactor plan

Documentation-only audit of `5871ae5614c3534fb1dde9195f4e3e9eff067bd4`, dated 2026-10-12. No implementation is included. Findings and source evidence: [current-state.md](current-state.md). Proposed boundaries: [target-state.md](target-state.md).

Subsequent database hardening and validation are tracked in [database-audit.md](database-audit.md); use its implemented/remaining distinction when scheduling the baseline tasks below.

## Priorities, effort and dependencies

Effort is a planning estimate for implementation plus focused tests in engineering days; validate it when each task begins. Owners are proposed responsibilities, not assumptions about current staffing.

| Priority / finding | Deliverable | Owner / effort | Dependencies | Regression risk and release evidence |
| --- | --- | --- | --- | --- |
| P0 / F01 | Allowlisted schedule projections; inspect other raw entity responses | Security + API / 1–2 | Inventory current nested response shape | Preserve teacher/book fields needed by UI; HTTP assertions forbid credential fields at every depth; auth tests if selection defaults change |
| P0 / F02 | Work-context-aware tenant/resource authorization for membership helpers and workflow paths | Security + API / 2–4 | Multi-school role/capability fixtures | Preserve platform administration and valid same-school reads; mixed A/B-role HTTP matrix, inactive org, omitted header, direct resource IDs |
| P1 / F03 | Atomic residence placement/move; explicit current-placement invariant | Residence + data / 2–4 | F02; duplicate/ownership preflight; transaction admission decision | Roll back delete/insert failure; simultaneous moves, capacity, imported unlinked students, old roster history; migration with no silent duplicate loss |
| P1 / F04/F06 | Concrete schedule import DTO, full reference preview and atomic commit/history | Schedule + transfer / 2–3 | F01/F02; existing transfer safety utilities | Wrong teacher/book/class, invalid late row, duplicate/repeat batch, authority fields and oversize input; unchanged legacy API shapes |
| P1 / F05/F07 | Transactional registration profile/contacts/progress plus catalogue policy reuse | Registration + records / 2–4 | F02; catalogue partial-update rules | Contacts retained after failure, derived status consistent, required/disabled/window rules, invalid persisted selections policy |
| P1 / F06 | Validated workflow/system mutation DTOs | Requests + operations / 2–3 | Payload/consumer inventory | Unknown fields, oversized arrays/text, malformed dates, review roles and state transitions; do not weaken manual ownership checks |
| P1 / F09 | Align root/Coolify stack with real shared app; validate build references | Operations / 0.5–1.5 | Decide supported alternate profiles | Existing host/service routes and persistent volume identity; build/smoke every supported topology on disposable volumes |
| P2 / F08/P01 | Explicit restore availability, bounded binary adapter, maintenance admission and recovery tests | Operations + data / 3–5 | Recovery ADR; F06; pre-restore backup policy | Concurrent requests, rejected upload, migration failure, WAL handling, old snapshots and audit continuity; production enablement remains separate |
| P2 / P02 | Unified host-owned SQLite write unit of work | API infrastructure / 3–5 | Concurrent cross-domain reproducer and writer inventory | Existing helper serialization/transaction nesting, fairness, failure release, overload bounds; integration tests across signup/import/attendance |
| P2 / F10 | Split Workflows into request/exit/occupancy use cases; establish repository writer ownership | Product API / 5–10 in small PRs | F02/F03/F05; characterization tests | Public endpoints remain stable; retained dorm/attendance methods delegate only after consumer proof; no schema moves in first PR |
| P2 / P03 | Measure query plans/load; scoped projections/counts/pagination and justified indexes | API + frontend / 3–5 | Representative synthetic fixture and latency target | Pagination compatibility, teacher/guardian visibility, deterministic ordering; compare measured plans/latency and memory |
| P2 / P04/P05/P06 | Realtime revocation tests, reliable-delivery decision, correlated logging/metrics | Platform + operations / 3–6; outbox extra 3–5 if needed | Threat/availability requirements; transaction strategy | SSE reconnect, no duplicated business actions, idempotent delivery, redaction and rejected-request logging |
| P2 / P07 | Failure-path and tenant tests for residence/registration/requests | Feature owners / 2–4 | Assertion map of current journey/security tests | Cover public behavior and real migrated DB; no redundant mocks mirroring implementation |
| P3 / entity cycles | Reduce the four baseline entity components incrementally | Data + API / 2–4 | TypeORM metadata/fresh-migration tests | Decorator runtime metadata/string relations, CommonJS initialization; reduce baseline after proof, never relax it |
| P3 / F11/P08 | Resolve root bcrypt consumer, viewer workspace ownership and stale topology docs; inventory dormant consumers | Tooling / 1–3 | Consumer/lifecycle decisions | Root lockfile utilities, docs-viewer tests; no npm workspace/root-lock migration or deletion incidental to audit |
| P3 / F12 | Review tracked dist-dev consumers and propose generated-output policy | Tooling / 0.5–1 | Build/bootstrap consumer proof | Development startup and migration tooling; deletion would be a separately scoped implementation change |
| P3 / F10/frontend | Split large timetable/student/access pages by tested interactions | Frontend / 3–6 per feature | Stable API DTOs and interaction characterization | Editing state, optimistic revisions, query keys, mobile focus, reduced motion, RTL/theme and accessibility |

F01/F02 are independent of major extraction and should be fixed first. A credible delivery schedule requires triage of those findings, staffing and measured workloads; the estimates must not be summed into a guaranteed deadline.

## Migration sequence and stop conditions

### Phase 0 — Preserve evidence and establish release gates

Keep these audit documents as the baseline. Reconcile current source after every pull. Refresh Graphify when available, but verify source before edits. For each implementation task, create a separate branch from current origin/develop through `scripts/cicd/start-work.sh`; use a worktree if the checkout has unrelated changes.

Map mounted controllers, payload/response consumers and security tests. Run workspace/architecture/contracts and component-defined validation. Establish representative disposable fixtures with multiple schools, roles, linked/unlinked students and existing historical records. Do not copy production personal data into tests. Before any schema PR, capture constraints and migration history and define backup/repair/rollback ownership.

Stop if a resource's authority or data owner is ambiguous; document UNKNOWN and resolve the business rule before a destructive cleanup or new uniqueness constraint.

### Phase 1 — Contain confirmed exposure and authority defects

Ship F01 and F02 as narrow compatibility fixes with adversarial HTTP regression coverage. Verify teacher/guardian/student/operator projections and platform exceptions. Avoid tying these fixes to renames, package extraction, a new DB engine or UI redesign. Treat previously exposed real credentials according to the operator's incident assessment; the audit itself does not establish exposure history.

Exit: affected routes return allowlisted data and cannot reuse school A permissions against B; security and existing client tests pass. Revert code-only changes through a reviewed fix PR if behavior regresses; never loosen guards as rollback.

### Phase 2 — Make existing writes safe

Make residence, registration and legacy schedule imports atomic; introduce concrete mutation schemas. Reuse `apps/admin/src/shared/lib/spreadsheet-transfer.ts` for workbook parsing and CMB data-transfer for neutral normalization/safety. Preview and commit must enforce scope on the server and revalidate referenced data; preview is not an authorization token. Preserve per-row errors, bounded batches and import audit/history.

For one-room uniqueness, run a preflight on an authorized snapshot, classify conflicts and require explicit resolution. Add constraints only once ownership/history semantics are settled. Registration catalogue fixes should report existing invalid selections and avoid unexpected unrelated-edit failures.

Exit: failure injection leaves no partial records/contact loss; concurrency tests preserve capacity/placement; migration-from-zero and upgrade tests pass. For additive code/schema changes keep old reads compatible until verified. For irreversible data repair, rollback is restoration of the tested pre-migration backup, not a code revert.

### Phase 3 — Establish ownership without directory churn

Build an entity/table/migration writer ledger. Keep current Nest modules but expose small public queries/commands. Replace direct cross-owner writes with owner use cases using the shared transaction context. Split request approval, exit movement and occupancy from WorkflowsService; route retained dorm/attendance helpers through their owners only after verifying consumers. Separate timetable policies and projections from persistence/notification orchestration. Reduce TypeORM cycles individually with metadata and migration tests.

Exit: each invariant has one authoritative writer and cross-owner dependencies are explicit. Keep legacy `/api/v2` controllers as adapters while migrating callers. Do not remove dormant modules, tables or exports in this phase.

### Phase 4 — Improve operations from measured needs

Rehearse restore on disposable infrastructure and introduce maintenance admission before considering remote enablement. Measure slow queries and event-loop/write contention, then optimize counts/projections/indexes. Define notification guarantees; add a transactional outbox only for work that needs retry durability. Test SSE revocation and safe request correlation. Set backup retention/off-host storage and recovery objectives with operators.

Align alternate Docker profiles, preserve production project/volume names and test their real Dockerfiles. Confirm the private deployment workflow matches its source template and live checks/protections enforce tested-SHA release. No production migration/deployment is implied by this audit.

Exit: documented load envelope, alerts, restore drill and every supported topology's smoke tests. PostgreSQL or service extraction requires its own ADR, migration rehearsal and compatibility proof.

### Phase 5 — Consolidate only after stability

Split UI coordination into cohesive feature hooks/components while keeping one responsive capability-aware flow. Promote shared product libraries only for real consumers. Reconcile root dependencies and docs viewer orchestration. Publish a dormant-code consumer inventory before separately proposing deletions or renames. Remove compatibility APIs only through an approved version/deprecation window.

## Validation and audit execution record

The audit used the existing installed dependencies; it did not run a root install, seed, reset, restore, production database query or production deployment. `npm run verify` invokes component tasks in workspace order and may generate ignored build artifacts. No generated artifacts are intended as audit changes.

| Command/evidence | Audit result |
| --- | --- |
| `.github/ai-toolkit/scripts/detect-project.sh` | Ran successfully; output was checked against manifests/source rather than accepted as authoritative (it labels TypeScript projects generically as JavaScript). |
| `npm run workspace:check` | Passed: 20 projects, acyclic declared DAG, leaf lockfiles. |
| `npm run workspace:list` / `workspace:plan -- build` | Passed; confirms ordered components and missing docs-viewer coverage. |
| `npm run architecture:check` | Passed: 1,322 scanned files, 209 cross-module edges, four tolerated entity cycles, 14 CMB packages without app backedges. |
| `npm run cmb:compatibility` | Passed: private 0.1.x packages, lockstep-minor policy. |
| `npm run contracts:check` | Passed; structural role/capability/entrypoint check, not full HTTP behavior coverage. |
| Disposable ts-node service assertions | Passed: F02 membership context mismatch and F04 sequential failure path. No real DB, credentials or personal data. |
| `npm run verify` | Passed, exit 0: CMB/shared UI/reference package tests; backend typecheck, 55 suites / 386 tests and build; Admin typecheck, formatting, lint, 145 files / 512 tests, six accessibility tests and build; student-core build and ten tests. Existing installed dependencies were used. |
| `npm run docs:check` | Passed: 271 Markdown files scanned, including these documents. |
| `git diff --check` | Passed; final staged diff is also checked before commit. |

Non-failing output included Admin lint/build warnings (including a PostCSS `from` warning) and expected exception logs from error-boundary tests. Those warnings were not silently treated as resolved defects; they do not change the successful command exit status. Full workspace verification does not include the separate security E2E script, Playwright release journeys, docs-viewer or image builds.

Not executed as part of this audit: production benchmarks/query plans, production recovery, remote GitHub configuration inspection, container image builds, full live-browser journeys and vulnerability/advisory scanning. Existing CI defines many of these checks; do not interpret that definition as a passing run. Follow-up work must run focused regressions, then the relevant release-quality scripts and migration/security/container gates before merging.

## Review and release discipline

Keep each fix/refactor reviewable and independent. Follow the repository branch/PR/check lifecycle without force pushes or weakened protection. Main promotion and deployment require their own successful required checks/release review; do not merge unrelated application changes to activate architecture tooling. Every implementation PR states affected APIs/data owners, validation actually run, compatibility/rollback plan and remaining UNKNOWNs.
