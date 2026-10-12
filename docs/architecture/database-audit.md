# Database and persistence audit

Date: 2026-10-12 (Asia/Tehran). Audited source baseline: `fce04c6e6e2d8110a4217233eece973d521c9a4d`. The [migration/rollback plan](database-migration-plan.md) was produced before implementation. No configured application database, production record, secret, reset command or production migration was used. Measurements and integration tests create disposable SQLite files under new OS temporary directories and clean up only those files.

## Scope and reproducible evidence

The audit inspects every entity's TypeORM metadata against the **migrated** database, not a schema made by synchronization. The [complete evidence artifact](database-audit-evidence.json) contains all 110 tables, columns/primary keys, foreign keys, index columns/uniqueness/partial flags, CHECK-bearing DDL, triggers, owning entity source paths, entity/schema mismatches, benchmark SQL/plans and recovery checks. Raw SQL tables without an entity are explicitly identified. It contains schema/measurements, **no table rows or credential values**.

Backend shorthand paths `database/...` and `modules/...` below are relative to `apps/api/src/`. The evidence artifact supplies full repository paths for every entity. The new migration is `apps/api/src/database/migrations/1730800000000-PersistenceUniquenessAndReadIndexes.ts`; integration tests are `apps/api/test/database-persistence-integration.spec.ts`.

`apps/api/scripts/audit-database.ts` is reproducible with:

```bash
cd apps/api
npm run audit:database
```

For JSON-only output use `npm --silent run audit:database`. The script never accepts a database location and never imports the configured data source. Its “before” schema runs the historical migration chain through `1730700000000` with the corrected pending NightAttendance behavior; entity metadata is current. It then verifies backup restoration, applies pending migrations to the synthetic file, verifies unchanged business rows and measures again. Original pre-change observations were separately measured before optimization. It is not a live-production benchmark or a byte-for-byte recreation of the old unsafe migration.

Graphify graph/executable remain unavailable; source inspection and architecture gates were used. Actual production cardinalities, query plans, corrupted/duplicate data, retention policies, deployed migration state and PostgreSQL behavior are **UNKNOWN**. No PostgreSQL migration or PostgreSQL performance result is claimed.

## Schema and ownership review

At baseline there are 94 entity files and 117 migration files; this change adds one migration. The fully migrated database has 110 application/bookkeeping tables and 190 FK entries. The new schema has 183 unique indexes including SQLite primary-key autoindexes. Two tables have CHECK expressions: `platform_enrollment_settings` and `dorm_attendance_delegates`. Most enum/range/state invariants are application validation, not database CHECKs.

| Area / source | Primary/relationship constraints and integrity assessment |
| --- | --- |
| Identity: `database/entities/user.entity.ts`, `session.entity.ts`, role/membership/assignment entities | Global account IDs, unique username/phone/email; nullable legacy phone/email permit NULL. Credentials are stored as hashes, sessions use hashed tokens; user entities select passwordHash by default, so raw relation responses require projection. Role assignment scope/owner triggers and partial uniqueness for global assignments come from `1730700000000-DatabaseRelationshipIntegrity.ts`. |
| Organizations: `organization.entity.ts`, `organization-membership.entity.ts` | Accounts may have multiple memberships; a student's primary organization is separate. Active membership alone cannot transfer the current role's authority to another school. Individual FK existence does not prove same-school ownership. |
| Students: `student.entity.ts`, profile/contact/progress/requirement entities | Unique non-null nationalCode and unique linked user; imported records may have no account. Profiles are one-to-one, contacts are unique by student/type, progress by student/org/section. Registration profile/contact/progress writes still need an aggregate transaction; separate saves/deletion can leave partial state. See `modules/registration/registration.service.ts#updateProfile/setContacts/reviewSection`. |
| Education: `education-class*.entity.ts`, study-group entities | Class code scoped by organization; enrollments unique by class/student; books unique per class/book; groups have membership uniqueness. Class/student, group/class/student and teacher assignment tenant compatibility are mainly service policies rather than composite database references. `ClassesService.setBooks/setEnrollments` uses transactions and protects published timetable references. |
| Attendance: `attendance-session.entity.ts`, `attendance-record.entity.ts`, receipts/pools/delegates | Occurrence identity unique per org, request receipts unique per org/actor/request. **Baseline migrated marks lacked the entity-declared unique session/student pair.** The new migration enforces it. Distinct manual sessions on one day are not presumed duplicates. Physical observation, review decision, roster snapshot, revision and receipt history remain intact. |
| Residence: `dorm-room.entity.ts`, `dorm-room-assignment.entity.ts` | Room code unique per org; baseline placements unique only by room/student. Service semantics explicitly require one current room per student. New student-only uniqueness and assignment tenant triggers protect this invariant; historic conflicts abort migration rather than choosing a winner. Capacity remains service validation; alternate direct writes could still overfill a room. |
| Timetable: `timetable.entity.ts`, `school-schedule-entry.entity.ts` | Versions, allocations, occurrences and change history have explicit keys/indexes and RESTRICT links for history. Legacy entries and published-version entries coexist; nullable versionId is intentional. Published/override conflicts use application policy and revisions. SQLite does not provide PostgreSQL-style exclusion constraints here. |
| Leave/exit/letters: request entities and `modules/workflows/workflows.service.ts` | Organization/student/user FKs and several scoped status/date indexes. Review roles/state transitions are service-owned. Selected-school policy is now applied to membership-derived reads and explicit targets. Request bodies and transition concurrency still warrant separate API/schema hardening. |
| Notifications/audit: `notification.entity.ts`, `audit-log.entity.ts` | Notifications already have user/date and unread indexes and a **partial unique user/dedupeKey index**. Do not add a duplicate index from the earlier potential-risk wording. Audit has actor/metadata but no database append-only protection; privileged system reset clears product/audit tables. Never run it for migration/recovery. |
| Historical domains | Plans, exams, attempts, learning, reports, chat, sync/activity and other retained tables are inventoried even where their module is dormant. They are not removable simply because the school composition omits a module. |

After hardening, entity FK metadata and declared unique-key columns match the inventoried database. The additional `student_presence.currentTaskId` OneToOne mismatch was traced to `ActivityService`'s task query, which requires the plan's student to own that task. A partial unique index now enforces the declared non-null pointer uniqueness; NULL pointers remain valid. Parent-side tenant changes, current-task owner matching and other cross-school relations still need a complete ownership policy before adding composite FKs/triggers.

SQLite PK behavior must be interpreted from full DDL, not just the PRAGMA `notnull` flag (INTEGER PRIMARY KEY has special rowid semantics). Migration IDs remain unchanged; several historical files share timestamp prefixes, and TypeORM migration class names are distinct. Do not sort/renumber history casually. Index names are made explicit for the new constraints so fresh and upgraded schemas agree.

## Verified defects and implemented changes

| Severity | Confirmed evidence | Implemented remediation / compatibility |
| --- | --- | --- |
| High | `1728234800000-NightAttendance.ts` rebuilt attendance_sessions with DROP TABLE. A populated disposable regression demonstrated that child marks vanished through ON DELETE CASCADE; custom parent indexes were lost. Its down path filtered out night/pool records. | Remove the unnecessary SQLite varchar-length rebuild while retaining the migration ID for pending databases; down now rejects destructive reversal. Already-applied migrations are not replayed. New indexes are introduced in `1730800000000-PersistenceUniquenessAndReadIndexes.ts`. Previously lost production marks cannot be reconstructed from this patch; authorized backup investigation would be required. |
| High | `WorkflowAttendanceLeaveLetters1724148100000` created a non-unique attendance session/student index despite entity uniqueness. Synchronize-based tests hid this mismatch. | Add database UNIQUE(sessionId,studentId). Preflight rejects duplicates and broken FK references without edits; independent-connection writes and simultaneous service retries have regression coverage. |
| High | `DormitoryService.setAssignments` moved/deleted placements before separately saving replacements; student-only uniqueness was absent. | Shared SQLite admission queue and transaction for movement/replacement; student uniqueness and same-school insert/update triggers. Failures preserve original assignment IDs. Existing replacement semantics are retained, not converted into automatic historical cleanup. |
| Medium | `student_presence.currentTaskId` was OneToOne in metadata but FK-only in `1724141600000-PresenceActivity.ts`; `ActivityService` restricts the task to the student's plan. | Add partial non-null pointer uniqueness after a conflict preflight. Duplicate historical pointers are preserved and block upgrade; multiple NULL pointers and valid populated upgrades have integration coverage. |
| High | `SchoolAccessService.organizationForUser` used any membership, independent of the selected role/tenant; Workflows re-queried memberships directly. | Respect explicit scoped organization IDs (including empty scope), active organization/membership and selected tenant. Workflows delegates to the same public school-access policy. Platform administration remains deliberate. Existing attendance/class-group domain error codes are preserved by checking their context before the generic helper. |
| High | `ScheduleService` returned selected teacher entities with passwordHash through list/export/create/update. | Allowlisted teacher projections for top-level and nested class-book teachers; actual migrated-database regression covers reads and writes. Auth credential selection is unchanged. |
| Medium | `SystemService.validate` used quick_check and table names only; structurally valid snapshots could have dangling FK references. | foreign_key_check now rejects invalid snapshots before closing/replacing the connection. An isolated application backup/restore test confirms data restoration and completion audit; a corrupted-reference snapshot leaves the live test file unchanged. |
| Medium | `DormitoryService.listRooms` eagerly hydrated assignments and students only to count them. | One scoped room projection with indexed correlated COUNT; unchanged response fields, zero counts for empty rooms and deterministic name/id ordering. This was one large joined query, not an N+1 issue. |

The new migration creates only indexes and two assignment triggers; it has no DELETE, UPDATE, table rebuild, seed or reset. All conflicts stop before new schema objects are created. Its down removes only its own indexes/triggers and retains rows. Neither rollback nor rollout was executed on a configured application database.

## Measured query performance

Final verified timings are recorded in the evidence artifact and summarized below. Method: Node 22.23.3, SQLite 3.53.2/better-sqlite3, one benchmark process, sequential query families, five warmups and 40 timed executions, warm cache. Synthetic workload: 10 schools, 30,000 students, 1,000 classes/30,000 enrollments, 2,000 rooms/24,000 placements, 4,000 attendance sessions and 120,000 marks. Session marks use the corresponding class roster and student curriculum/primary school; fixture accounts are unnecessary.

Timings include TypeORM query/hydration for the listed SQL, not HTTP/auth/network or complete dashboard work. The session-list benchmark measures the base scoped session query; endpoint record/creator joins and permission filtering are additional work. No p95 production latency or throughput claim follows from these numbers. Small differences on unchanged queries are run/host variation.

| Query / workload | Before median / p95 (ms) | After median / p95 (ms) | Interpretation |
| --- | --- | --- | --- |
| Student attendance lookup | 17.784 / 18.474 | 0.562 / 0.953 | Indexed search replaces full scan and temporary sort. |
| Scoped base session list | 6.617 / 12.108 | 6.109 / 8.286 | Base query only; fresh historical org/date index already exists. |
| Student enrollment lookup | 0.126 / 0.143 | 0.127 / 0.137 | Existing index retained; difference is noise. |
| Current dorm placement lookup | 2.478 / 2.717 | 0.413 / 0.498 | Student uniqueness index also accelerates lookup. |
| Registration student list | 144.651 / 163.413 | 144.475 / 151.382 | Unchanged query; no material improvement claimed. |
| Old room roster hydration (control) | 102.876 / 106.738 | 103.382 / 109.441 | Unchanged eager query; confirms indexes alone do not fix hydration. |
| Room list → count projection | 102.876 / 106.738 | 2.135 / 2.690 | 200 room rows instead of hydrating 2,400 placements/students; one query. |

Original pre-change medians on the initial fixture (1,000 sessions, 120,000 marks) were attendance/student 17.341 ms, dorm placement 2.512 ms, room hydration 102.935 ms, student list 145.110 ms and enrollment lookup 0.135 ms. These were measured before index/query changes. The final consistent fixture uses four 30-student occurrences per class instead of oversized per-session rosters; use the final paired run for comparisons.

Index decisions:

- `IDX_attendance_record_student_created(studentId,createdAt,id)`: real `AttendanceService.summary` student predicate/order. Plan changes from a mark-table scan plus temporary ORDER BY tree to indexed search. Pair uniqueness is a separate integrity requirement.
- `UQ_dorm_assignment_student(studentId)`: enforces current-placement semantics and replaces the scan in prior-placement lookup. Existing room/student uniqueness remains useful for room counts; new count subquery uses it as a covering index.
- `IDX_attendance_session_org_date_id(organizationId,sessionDate,id)`: supports the real scoped/date-ordered session list and repairs layouts that lost the original date index through the old NightAttendance rebuild. The corrected fresh historical baseline already retains the original org/date index, so a small latency difference is **not** evidence of a dramatic optimization for that baseline.
- No new enrollment index: the existing `IDX_education_class_enrollment_student` already supports the measured reverse lookup.
- No speculative student/name/notification indexes: notifications already have suitable indexes; an unpaginated student list is dominated by hydration. A future org/created/id index can support a versioned cursor API, but its benefit/write cost needs a workload benchmark for that API.

## Query shape, pagination and remaining risks

Confirmed patterns, not unmeasured latency claims:

1. `ClassesService.list/load` joins full books/teachers/enrollments before final filtering. `AttendanceService.listContexts/listSessions` similarly hydrates rosters/marks for counts. Use scoped query projections/aggregates when measured; do not weaken teacher/guardian resource policy to simplify SQL.
2. `ClassesService.setBooks` resolves a teacher for each requested book; each `resolveTeacher` reaches `staffMember` membership/role joins. Repeated teachers can repeat queries. `AttendanceService.bulkMark` performs per-entry find/save operations inside its transaction. Statement counts/latency at the maximum batch were not measured; batch compatible reads/writes only after preserving per-row checks, revisions, history and idempotency.
3. `WorkflowsService.occupancy` runs student count and exit query per scoped school. The selected-tenant change bounds the normal user path; a global operator reporting path should batch aggregates if measured to be costly. `GuardianService.dashboard` repeats child authorization through progress/schedule/exam calls; this is additional fixed work, not proven unbounded N+1.
4. Students/registration/classes/rooms/session lists largely return arrays with no cursor contract. CreatedAt-only ordering has ambiguous ties. Room ordering now includes ID, and notifications already use createdAt/ID cursors. Future pagination must carry stable sort keys, apply tenant/resource filters **before** limit and preserve old response compatibility through an explicit new contract. OFFSET can become expensive and shift under concurrent inserts.
5. Dormitory search uses `%term%` LIKE; ordinary name indexes cannot generally provide efficient arbitrary substring search. Persian normalization/collation and phone lookup semantics need explicit requirements before FTS or prefix changes. No LIKE SQL injection was found in the parameterized TypeORM use.
6. SQLite's process-local admission queue covers attendance/timetable/residence participants. Other domains still use independent TypeORM transactions/autocommit writes; cross-domain nesting on the single driver connection needs a dedicated concurrency/admission design and tests. The new database constraints protect duplicates even outside the queue, but do not solve all transaction isolation problems or enable multiple API replicas.
7. Database CHECK coverage is sparse; many range/status and class/student/attendance tenant invariants are enforced only by services. Their historical data must be preflighted before constraints are tightened. Dorm capacity and parent-side organization updates are not fully database-enforced by the new assignment triggers.
8. Remote restore remains disabled in production defaults and still lacks the active Fastify binary parser/bound alignment noted in the architecture audit. Restore/reset maintenance admission, concurrent requests, audit continuity and rollback retention require operator-level hardening. The isolated recovery test is not certification of the live HTTP restore route.

## Backup, audit and multi-school operations

Deployment `scripts/deploy/lan.sh` uses better-sqlite3 online backup before replacement; SystemService uses VACUUM INTO for download/rollback snapshots. Do not copy only the main file from a live WAL database. Both verified test paths restore to isolated files with foreign keys enabled. The large fixture drill compared all 212,016 rows across 110 tables plus schema objects; the upgrade retained all 211,899 non-migration rows exactly; the application restore drill checks retained student data, FK integrity and completion audit. New-migration up/down preserves custom test indexes/triggers and all existing rows.

Audit statements inside attendance/timetable transactions are durable with the change. Other product operations do not consistently audit every write. System restore writes a start audit into the old file and completion into the restored file; reset clears prior product/audit tables. Do not assume immutable/global history or a retention policy from the presence of an audit table. Establish protected append-only audit ownership, tenant visibility, off-host export/retention and a restoration receipt outside the replaced database.

SQLite remains one API replica with a persistent volume, WAL, FK enforcement, busy timeout, `synchronize: false` and explicit migrations. `DATABASE_TYPE`/`DATABASE_URL` do not currently select a PostgreSQL adapter. Startup applies pending migrations (`migrationsRun: true`): rehearsal on a verified restored snapshot is mandatory because conflicting existing rows will intentionally abort startup. This audit does not establish that production has no duplicates.

For future multi-school support: keep global identity distinct from tenant membership and primary student ownership; authorize the selected capability/tenant/resource together; inventory nullable/global rows; introduce approved same-tenant references and owner policies; ensure background jobs/import/export enforce the same scope. PostgreSQL RLS would supplement application policy and require tested connection context, not substitute for role/resource authorization. Follow the staged engine strategy and rollback write boundary in [database-migration-plan.md](database-migration-plan.md).

## Validation record

Focused integration checks passed for restoration, preservation, conflict refusal, independent connections, concurrent retries/moves, rollback, scoped counts, tenant boundaries and response privacy. The original populated NightAttendance test failed before its safety fix with the child mark removed, and passed after. A broad backend run exposed three changed error codes; targeted compatibility corrections restored all 45 attendance/class-group tests without weakening checks.

Validation passed: root `npm run verify`; final backend lint, 56 suites / 404 tests (including 18 disposable persistence integration tests), and build; security matrix, student journey and self-signup/advisor onboarding HTTP checks; architecture, CMB compatibility, API contracts, documentation health and `git diff --check`. The compiled `dist/main.js` entrypoint exists. Existing test fixtures sometimes use synchronization; the new file-backed persistence integration suite and benchmark do not. PostgreSQL tests, production benchmarks, production restore/deployment and production-data investigation were not executed.
