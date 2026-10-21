# Attendance modernization implementation ledger

Source: user-supplied “Zanin School Attendance System — Complete UI/UX, User Flow, Architecture & Feature Improvement Plan”, supplied on 11 October 2026. The entire plan remains the implementation objective. This ledger tracks delivery, not a reduced substitute for that plan.

## Required delivery and evidence

| Phase | Requirements retained from the plan                                                                                                                                                                                              | Proof required                                                                                        | Status                                                                  |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1     | Context ownership, authorized organization, active role/capability, assigned staff, and participant membership on all attendance writes                                                                                          | Real SQLite/API cross-tenant and role/assignment regression tests                                     | Existing endpoints hardened; new session endpoints still to be verified |
| 2     | Complete bounded batch validation, duplicate-ID rejection, transactional writes, stable session occurrence identities and request idempotency                                                                                    | Rollback, timeout/retry, simultaneous/duplicate-submission integration tests                          | Pending                                                                 |
| 3     | Scheduled class/group/dorm occurrences, explicit exceptional sessions, saved roster snapshots, session retrieval, revisions, draft/submitted/finalized lifecycle                                                                 | Migration and session lifecycle/occurrence tests; frontend saved-session retrieval                    | Pending                                                                 |
| 4     | Separate physical absence from approved excuse; explicit migration for legacy excused records; atomic reviews and immutable decision history                                                                                     | Legacy backfill, concurrent-review, authorization and audit-history tests                             | Pending                                                                 |
| 5     | Scoped persistent drafts, draft save versus final submit, confirmation, late details, safe corrections, unsaved-change and request-state protections                                                                             | Principal/supervisor/teacher workflow and failed-save/retry tests                                     | Pending                                                                 |
| 6     | Principal overview: unique students versus academic events, provisional coverage, pending cases, recent activity, entry as secondary action                                                                                      | Real API aggregation/denominator tests and responsive screenshots                                     | Pending                                                                 |
| 7     | Supervisor operations, incomplete/overdue sessions, prioritized exceptions, follow-ups, substitute delegation, review notes/conflicts                                                                                            | Scoped operations/review/follow-up integration tests and screenshots                                  | Pending                                                                 |
| 8     | Teacher timetable resolves occurrence; fast shared roster/search/progress/bulk controls; wider desktop sheet and focused mobile task; saved outcome/corrections                                                                  | Timetable occurrence tests, touch/keyboard/contrast tests and screenshots                             | Pending                                                                 |
| 9     | Dorm building/floor/room/roll-call navigation, occupancy/completion, physical accountability separate from leave, persistent missing-student cases and explicit resolution/escalation                                            | Roll-call/leave/discrepancy/case persistence tests across day boundary                                | Pending                                                                 |
| 10    | Scheduled study sessions, assigned mentors, membership effective at session date, saved history; shared engine                                                                                                                   | Group scope and historical roster tests                                                               | Pending                                                                 |
| 11    | Existing student self surface: contextual timeline/calendar/filters, explanation and correction requests, review outcomes/notifications; no direct official edits                                                                | Own-record privacy, request lifecycle and UX tests                                                    | Pending                                                                 |
| 12    | Configurable school timezone and 04:00 operational-day boundary, non-destructive rollover, overnight identity, previous-date selection                                                                                           | Before/after boundary, timezone/DST, overnight, unresolved-case tests                                 | Pending                                                                 |
| 13    | Daily/weekly/monthly, student/class/group/dorm reports and trends, explicit denominators/late/excuse policies and provisional labels; scoped exports                                                                             | API/report scope tests and exported artifact checks                                                   | Pending                                                                 |
| 14    | Authorization-aware navigation/actions, TanStack Query scope, relevant realtime invalidation/conflict handling, all required loading/empty/error/permission/session states, Persian/English RTL/LTR, theme/mobile/tablet/desktop | Full relevant tests/typechecks/lint/builds, a11y/browser matrix and updated documentation/screenshots | Pending                                                                 |

Optional additions remain evaluated against real need: offline **draft** persistence, virtualization, charts, decorative motion, and suggested libraries. No unnecessary package additions. The separate `apps/student/` application is absent; per the plan, use shared contracts and the existing self-attendance surface without inventing a student app.

## Compatibility and migration rules

Preserve `/api/v2` callers; add session-based contracts alongside legacy endpoints until all present consumers migrate. Do not silently reinterpret old `excused` records. Use additive migrations with data/rollback checks. No production fixture data, disabled authorization, destructive database reset, or kernel/product dependency inversion.

## Current evidence

The initial audit is [archived attendance evidence](../archive/evidence/attendance-2026-10-11/README.md). Revalidate findings against source as each phase begins. Earlier header/Sonner changes and unrelated user Docker changes already exist in the worktree and must be preserved.

Graphify graph/executable are unavailable. Discovery uses focused source reads. The additive receipt migration has been verified on isolated in-memory SQLite databases. No manual live migration command was run. The user has a running API watch process which regenerates tracked `dist-dev` outputs as source changes; do not stop it or overwrite unrelated work.

## Increment 1 — Authorization, atomic writes, safe retries and review races

### Delivered

- Every existing class/group/dorm write resolves real context ownership before school-wide assignment exemptions. Supplied organization and existing-session organization must match. A missing/foreign `sessionId` returns an error rather than creating another session.
- Explicit active organization and selected effective roles constrain writes/reviews; the legacy `user.role` discriminator cannot widen an explicit selected role.
- Complete batches are validated before persistence; duplicate IDs, invalid dates/statuses, empty batches and more than 500 entries are rejected. DTO and service boundaries both enforce the relevant limits.
- Attendance session/record writes and their before/after audit entries commit atomically. A failed row or audit does not leave a partial save or publish an event. SQLite attendance writes sharing a connection are serialized.
- Optional UUID `requestId` receipts are scoped by organization and actor. An identical retry replays the original result; reuse for changed data returns a conflict. The receipt is saved in the same transaction. Replays recheck current context/assignment authority and do not duplicate audit/events.
- Existing Admin and teacher callers retain the exact request ID, timestamp and payload for an unchanged failed-save retry while the form remains mounted. This is **not** persistent offline storage: reload/unmount still requires the upcoming durable scoped draft/session work.
- Reviews use an atomic pending-state transition. Only one concurrent decision can win; audit failure rolls it back. Peer reviewers and the relevant recorder/student can receive the committed update; unrelated organization members are excluded from review broadcasts.
- Main attendance hides edit/save actions without `attendance.manage`, and derives direction from locale. Context loading and drafts reset on authority switches. Teacher query/draft keys include user/role/organization scope; a stale mutation result cannot close the new scope's drawer.
- Teacher controls are at least 44px, disable while saving, and closing a dirty draft requires confirmation. Late-state contrast improved. These changes are groundwork for the shared roster/full-screen workflow, not the completed teacher redesign.

### Changed files and contracts

API: `apps/api/src/modules/attendance/{attendance.service.ts,attendance.dto.ts,attendance.module.ts}`; entity/export `apps/api/src/database/entities/{attendance-write-receipt.entity.ts,index.ts}`; migration `1730100000000-AttendanceWriteReceipts.ts`; integration tests `apps/api/test/attendance.service.spec.ts`. School-access/realtime public entrypoints replace Attendance's private cross-module service imports.

Admin: `features/attendance/api/attendance.api.ts`, `model/attendance-write.ts` and its tests, `pages/AttendancePage.tsx`/tests, `views/AttendanceRosterView.tsx`, and `features/teacher-portal/components/TeacherClassAttendanceSheet.tsx`/tests.

Existing endpoints and response shapes remain available. `BulkMarkAttendanceDto` gains optional UUID `requestId`; errors include `ATTENDANCE_CONTEXT_ORGANIZATION_MISMATCH`, `ATTENDANCE_WORK_CONTEXT_MISMATCH`, `ATTENDANCE_SESSION_NOT_FOUND`, `ATTENDANCE_DUPLICATE_STUDENT`, `ATTENDANCE_BATCH_SIZE`, `ATTENDANCE_REQUEST_REUSED`, and existing `ATTENDANCE_REVIEW_CLOSED` for a losing review. Existing empty-batch code `ATTENDANCE_EMPTY` is preserved.

### Migration and rollout

The receipt migration adds a new table/index only; it does not rewrite existing sessions or statuses. Deploy the API migration before enabling request IDs in frontend traffic. Rollback preserves attendance but discards retry receipts: drain pending client requests first, because a receipt-less retry cannot guarantee deduplication. Existing clients omitting `requestId` remain supported but do not receive retry deduplication.

Audit history is append-only within attendance operations, using the existing organization-scoped audit table. A dedicated saved-session history endpoint, revision-based writes and correction lifecycle remain to be implemented.

### Verification and limits

- Attendance regressions fail against isolated pre-fix source: 12 failures, 3 passes in the original 15-case suite. Those failures demonstrate the tenant, validation, rollback, retry and related safeguards missing in baseline code.
- Focused real SQLite/HTTP integration suite: **28 tests passed**. Tests cover organization/role/assignment isolation, maximum/nested DTO validation, rollback, receipt replay and conflict, simultaneous retries, receipt migration up/down/up, review concurrency/audit rollback, and reviewer audience filtering. Authentication in the HTTP fixture is represented by a test actor; this does not substitute for a production cookie/CSRF end-to-end run.
- Admin targeted suite: **9 tests passed**. Tests cover unchanged-request retry on both forms, read-only actions and request identity construction.
- API and Admin production builds passed; Admin scoped ESLint passed. Revalidate these results after further edits. Global API lint remains blocked by the unchanged workflow-spec constructor error described below.
- Broad API validation has a pre-existing workflow-spec compilation failure (15 constructor arguments supplied, 16 required; missing NotificationsService). The same failure reproduces in the isolated baseline. The earlier broad run had 41 passing suites and 243 passing tests, with this one suite failing to compile; it is not an all-green test run.
- Workspace check/build-plan and contract scan fail because `apps/student/` is absent. CMB compatibility passes. Architecture scan already fails on baseline import/cycle violations; this increment removes Attendance's two private service-import violations without adding any.

### Next required work (full goal remains active)

Stable scheduled occurrences, persistent roster snapshots/effective membership, saved-session retrieval, revisions, explicit draft/final submit, controlled corrections and immutable history APIs. Then explicitly migrate physical attendance versus excuse decisions, build role-specific overview/operations/session/review/report/settings views, operational-day policies, dorm missing-student follow-ups, study-session scheduling, and student explanations/corrections. Complete bilingual responsive/a11y/runtime verification and update screenshots for the delivered redesign.

The existing approval API still projects `excused` for compatibility. This increment does **not** claim that the required physical-absence separation or full principal/supervisor/student redesign is complete.

## Increment 2 — Saved-session schema, safe legacy backfill and school dates

### Delivered

- Additive lifecycle fields retain session occurrence identity, revision, timetable source, title/staff/timezone snapshots, scheduled instants, operational date, submission metadata and roster capture metadata. A unique school/occurrence index protects the eventual resolver. The resolver and revision-based writer are still pending; fields alone do not complete phase 3.
- Physical observations have a separate field and record revision, including late minutes and arrival time. The migration preserves the original legacy status and review. Previously approved `excused` marks become physical `absent`; undocumented or rejected legacy excuses become `legacy_unknown`. Existing saved marks become submitted; missing historical roster, operational-date and submission facts remain unknown.
- School policy and recurring group/dorm schedule storage are added. Policy defaults are Asia/Tehran, 04:00, partial submissions allowed and late counted as present. Configuration endpoints and policy-based reporting remain pending.
- Pure school-time helpers avoid the server timezone, validate calendar dates and wall times, calculate the operational day without deleting data, and resolve overnight/DST times deterministically. These helpers still need to be integrated with the scheduled-occurrence resolver and all dashboard filters.
- `GET /api/v2/attendance/sessions/:id` returns saved records and stored roster facts using shared API contract types. Missing historical roster counts return `null`; current membership is not substituted. `GET /api/v2/attendance/sessions/:id/history` returns up to 100 scoped audit events. Both require attendance read capability, active organization and context authority; a stored responsible staff assignment permits historical reads after timetable reassignment without granting writes. The detail endpoint advertises read-only actions until the revision writer is installed.
- Legacy bulk writes reject managed occurrence sessions, preventing a future revision-aware workflow from being bypassed. Existing legacy callers remain supported. Review decisions preserve the physical observation and increment record revision.
- The API now consumes the existing local `@moshaver/api-contract` package through its public entrypoint. Its leaf manifest/lock and workspace dependency DAG are synchronized; no third-party runtime dependency or root workspace/lock migration was added.

### Migration and rollout

`1730200000000-AttendanceSessionLifecycle.ts` is forward-only: its `down` throws rather than deleting saved attendance facts or pretending the schema reverted. Keep additive schema when rolling application code back. Older code can stop updating the new physical/revision fields, so a rollback requires a compatible writer or a read-only attendance interval with explicit reconciliation before resuming the newer workflow. Verify a backup and migration on a copy before production rollout; no production migration or deployment is performed by these isolated tests.

### Verification

Migration tests start with the previous schema on isolated SQLite, then execute the real migration. They cover unchanged old statuses/reasons/reviews, explicit unknown physical status, unknown roster facts, school-scoped unique occurrences, nullable legacy occurrence IDs, default policy and unique organization ownership, staff deletion retaining snapshots, least-privilege student/teacher capability grants, and refusal of destructive rollback. School-time tests cover the Tehran 04:00 boundary, configured minute-accurate boundaries, UTC/server independence, overnight dates, spring gaps/fall folds, malformed calendar/timezone values, leap and year boundaries.

The workspace check still fails because `apps/student/package.json` is absent. Full UI workflows, lifecycle writes/resolution, durable drafts, role dashboards, historical memberships, student requests, missing-student cases, reporting and the updated screenshot matrix remain outstanding as recorded above.

## Guided-flow increment — Runtime schema discovery and simpler interaction

Following the user's additional request for simpler steps, mobile drawers and desktop modals:

- Fixed migration discovery relative to the running data source. The default local database was missing lifecycle columns; the existing development watch process applied the pending additive migration after the fix, confirmed by read-only schema inspection. Regression tests execute real TypeORM migrations from temporary production/development build layouts, independently of the working directory.
- Attendance entry now reviews totals and partial marking in a responsive confirmation panel. Teacher attendance has mark/review/confirm steps in a mobile drawer and desktop modal. Principal/supervisor absence review uses inspect/decision/confirm with an optional note and a retryable inline error. Review queries are keyed by active user/role/organization and late mutation success cannot close another scope's panel.
- Marking controls offer three physical states; the API rejects a direct new excused mark before any write. Existing history and legacy response projection remain readable. This semantic change requires coordinated updates for older independently deployed clients.
- Student history gains filtering and read-only record details in the same responsive panel pattern, with authority-scoped query keys. Student requests/corrections remain pending.
- Added ten current component screenshots and a concise role-flow explanation in [archived guided flows](../archive/evidence/attendance-2026-10-11/guided-flows.md). Preview data is synthetic and temporary preview source files are removed after capture.

Guided-flow checks: 48 backend tests across four suites passed; 11 Admin flow tests across four files passed. API build and scoped Admin lint passed. Ten desktop/mobile panels were captured with zero axe violations and no browser runtime errors. Admin production build (including TypeScript check) passed. Browser confirmation prompts for discarding attendance are replaced by explicit responsive keep/discard panels.
