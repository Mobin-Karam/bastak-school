# Attendance System Audit — 2026-10-15

## Scope and confidence

This is a source audit of the `feat/sms-operations-principal-lifecycle` checkout on 2026-10-15. It covers the active API, Admin, shared contracts, migrations, related timetable and guardian paths, and the attendance-focused test suites. It does not claim a production database, browser session, external realtime delivery, or mobile/student-client test was performed.

`apps/student/` is not present in this checkout, so no separate student-app attendance surface could be audited. The only current student-facing UI found is the Admin application's capability-gated `/my-attendance` route.

## Executive assessment

The attendance domain is substantially stronger than a basic CRUD implementation. The server is the authorization boundary; it snapshots rosters, validates organization/context membership, uses bounded transactional writes, optimistic revisions, idempotency receipts, audit logs, and event emission after commit. Its largest risks are now operational and product-completeness issues: drift between the capability catalog and enforced permissions, incomplete correction/finalization lifecycle, non-paginated staff reads, and a single-process realtime/transaction strategy that will not scale unchanged.

| Area | Assessment | Why |
| --- | --- | --- |
| Tenant and context isolation | Good | Service-level organization and class/group/dorm checks supplement controller capability gates. |
| Integrity of writes | Good | 500-item limit, duplicate detection, transaction, revision check, audit record, and request receipt. |
| Historical truth | Good | Session roster/title/staff snapshots avoid reinterpreting history from today's membership. |
| Role/capability governance | Needs work | Capability definitions, migration grants, UI gates, and controller gates have drifted. |
| Corrections and policy management | Incomplete | Contract exposes correction/policy concepts but the read model hard-codes no manage/correct ability. |
| Scale/realtime operations | Needs work | Several wide reads have fixed/no pagination; realtime is in-memory; SQLite writes are serialized in-process. |
| Student/guardian experience | Partial | Student gets aggregate encouragement plus delegated actions; guardian gets a limited legacy status view. |

## How it works

### Core model

`AttendanceSession` is the fact container: organization, context (`class`, `study_group`, `dorm`), date/occurrence, lifecycle status/revision, source/timetable information and roster snapshot. `AttendanceRecord` is one unique mark per session/student and stores the physical observation, legacy status projection, review result, actor, and timestamps. `AttendanceWriteReceipt` deduplicates a retry by organization + actor + request ID; `AuditLog` retains before/after operational evidence.

The system supports these flows:

1. **Manual class, group, or dorm marking.** Admin calls context/participant reads, then `POST /attendance/bulk-mark`. The service rechecks organization and context scope, creates a roster snapshot if needed, writes records and audit evidence atomically, then emits `attendance.updated`.
2. **Scheduled lesson attendance.** A teacher or allowed schedule user opens today's published lesson through `POST /timetable/lessons/:id/attendance`; the timetable service creates/links one schedule session. The assigned teacher can mark that saved roster only with `attendance.class.manage`.
3. **Absence review.** A physical absence enters `pending`; a user with `attendance.review` and contextual authority can approve (legacy status becomes `excused`) or reject it, using an atomic conditional transition and audit entry.
4. **Dorm delegation.** Staff with `attendance.delegate` may grant one resident responsibility for a room or every currently active room for a bounded date range. The delegated student's own account may only mark today's resident roster and must pass revocation, membership, roster, revision, and idempotency checks.
5. **Attendance pools/gatherings.** Staff create/close a time-limited pool; eligible students can self check in. Pool evidence uses snapshots so later roster changes do not alter the target audience.
6. **Read surfaces.** Staff see the main attendance workspace, histories, review queue, overview, profiles, delegates and pools. A student self route shows aggregate encouragement and delegated responsibilities. Guardians can read a linked child's last 60 marks.

### Access model

Authentication is required globally; `@RequireCapabilities` is controller-level coarse authorization, then services verify active organization and concrete resource scope. The Admin router/navigation also uses `CapabilityRoute`/`auth.can`, but that is convenience only.

| Actor | Granted/enforced access in current code | Important limitation |
| --- | --- | --- |
| Principal / organization admin / platform admin | Typical migrations grant read/manage plus review/settings/delegate additions. School-wide scope can access all eligible contexts. | Exact effective access is the active organization role/capability context, not the role label alone. |
| Teacher | Read/manage grants exist in role migrations; scheduled-class writes additionally require `attendance.class.manage` and assignment to the occurrence. | Generic `attendance.manage` is insufficient for the timetable route. |
| Advisor/mentor/disciplinarian/education managers | Older/newer migrations grant varying read/manage/context permissions. | Migration history grants are inconsistent; test each seeded role after upgrades. |
| Reviewer | `attendance.review` plus contextual manage authority decides absences, views review/staff operations. | A reviewer cannot bypass the context check. |
| Dorm delegate (student) | No staff capability needed; a saved bounded delegate record permits today's assigned room/dorm write only. | The controller currently labels these endpoints with `attendance.self.read`; the service carries the real delegation boundary. |
| Student | `attendance.self.read` reads summary/records, encouragement, own pool prompts and own delegation tasks. | Full record history exists as API but the visible self page intentionally shows aggregate data, not record details. |
| Guardian | `guardian.dashboard.read` plus verified child relationship reads the child's attendance list. | Response exposes only legacy `status`, note and date—not physical/review status or a summary. |

## API and consumer map

| Surface | API ownership | Primary consumer |
| --- | --- | --- |
| Context, roster, sessions, bulk marks, saved details/history | `AttendanceController` + `AttendanceService` | `apps/admin/src/features/attendance` and teacher attendance sheet |
| Reviews/live records/self summary | Same controller/service | Staff review queue, Admin self route |
| Delegates, dorm night marks, pools, staff overview/profiles, encouragement | `AttendanceOperationsController` + service | Admin staff/student attendance workspaces |
| Class lesson opening | `TimetableController` + `TimetableService` -> `AttendanceService` | Teacher dashboard/schedule |
| Guardian history | `GuardianController` + `GuardianService` | Guardian consumer, if mounted |
| Shared types | `packages/api-contract/src/attendance*.ts` | API and Admin |

## What is working well

- **Server-side resource checks:** Context authorization is repeated in service methods rather than trusting hidden UI. Scheduled sessions separately validate the teacher assignment. This is the correct defense against URL and client manipulation.
- **Tenant/membership handling:** Reads and writes derive permitted organization IDs from the authenticated work context. Tests cover foreign, stale-active-organization, unassigned-teacher, and cross-context attempts.
- **Durable historical interpretation:** Snapshotting a roster, title and assigned staff protects reports when class enrollment, rooms, personnel or timetable entries later change.
- **Safe write semantics:** Batch requests reject empty, duplicate, foreign and over-500 entries before persistence. The transaction rolls back all rows on a later failure. Retry receipts return the original committed result and reject a reused ID with different content.
- **Concurrency controls:** Revisions prevent stale session/dorm writes; the absence review has a conditional pending-to-decision transition to protect cross-process races.
- **Auditability:** Marking, absence decisions, timetable changes and delegation operations record audit events with useful before/after metadata.
- **Migration posture:** Attendance lifecycle/delegation migrations are additive and deliberately refuse data-losing rollback after facts are saved. Migration tests use real SQLite schemas.
- **Operational UX foundations:** The Admin page has capability gating, explicit unsaved-change handling, retry IDs, responsive components, staff history/profile inspection, and focused tests including accessibility checks.

## Findings and improvements

### P0 — verify before next production scale-out: realtime and write serialization are process-local

`RealtimeService` is backed by `InMemoryRealtimeHub`; no shared broker is visible. `attendanceTransaction` serializes writers with an in-memory `WeakMap` to accommodate `better-sqlite3`. Both protections disappear across multiple API processes/containers. In a horizontally scaled deployment this can cause missed live refresh events and lock/contention behavior that the single-process queue was hiding.

**Action:** Keep the current transaction/revision constraints, but choose and test a shared event transport plus a production-grade database locking/concurrency strategy before running multiple API replicas. Add a deployment test with two API instances and concurrent same-session writes.

### P1 — capability taxonomy is drifting from enforcement

`SCHOOL_CAPABILITIES.attendance` declares read/manage/review/context/self-read but omits capabilities enforced elsewhere: `attendance.delegate`, `attendance.correct`, `attendance.reports.read`, and `attendance.settings.manage`. Migrations grant several of those codes, and controllers/services enforce `attendance.delegate`. Older migrations also contain obsolete-looking capability names such as `attendance.manage.all` and `attendance.view.class`.

**Impact:** New role editors, navigation, permission exports, or policy audits can silently miss a real attendance authority. A customized role may see an action based on one capability but receive a 403 from an endpoint requiring another.

**Action:** Make one authoritative attendance capability registry (including descriptions, owning module, risk level and UI/API consumers); reconcile migration grants against it; add a migration-safe capability parity test that seeds every active role and verifies expected allow/deny behavior.

### P1 — correction/finalization and policy features are modeled but not delivered

The shared contract has `canCorrect`, policy fields, lifecycle statuses and correction-related capability migrations. Yet `sessionDetail` currently sets `canManage = false`; prior source comments say the revision writer is not installed, and no policy controller was found. Standard correction reasons, approver separation, finalization/lock timing, and retention/export rules therefore remain incomplete.

**Impact:** Staff can change existing manual marks through the bulk endpoint when authorized, but there is no explicit correction workflow that explains who changed an already submitted/finalized fact, why, and under which policy.

**Action:** Implement an append-only correction command with required reason, previous/new state, expected record/session revision, capability (`attendance.correct`), configurable correction window, reviewer policy, and audit/event. Add policy read/update endpoints only behind `attendance.settings.manage`. Do not reuse raw bulk marking as the long-term correction mechanism.

### P1 — staff read paths will degrade and can over-disclose at scale

`listSessions` reads all scoped sessions before filtering in memory. Contexts/participants, delegate residents, staff sessions/profiles and several overview paths similarly have no pagination/cursor contract; review/live records use fixed `take` limits with no continuation token. `dormResidents` also performs per-row active-membership checks.

**Impact:** Large schools will hit slow requests, unbounded memory, inconsistent “latest N” dashboards, and a growing N+1 query cost. A staff user with generic read may retrieve broader operational data than a narrowly scoped dashboard needs, even when it is technically in the organization.

**Action:** Add cursor pagination and server-side context filters to staff reads; index against the actual query patterns; replace membership loops with joins/existence queries; define minimal projections per screen. Load-test a realistic school (for example, 2,000 students, daily marks, multi-term history) before expanding rollout.

### P1 — timetable and generic UI capability gates can disagree

The visible teacher/dashboard components pass `auth.can("attendance.manage")`, while the timetable endpoint requires `attendance.class.manage` and schedule ownership/teacher assignment. Standard role migrations may grant both, but custom capability assignments need not.

**Action:** Expose one derived “may mark this occurrence” server response, or gate the control on the exact `attendance.class.manage` capability plus schedule ownership state. Add a UI/API parity test for a custom role with generic manage only.

### P2 — guardian and self visibility contracts need an explicit product decision

Guardian attendance returns a maximum 60 records but only the legacy status, note and date. The self API can return detailed records while the current self page displays only aggregates plus delegated actions. This is privacy-conservative, but the contracts are asymmetrical and can confuse support teams when an approved excuse appears as legacy `excused` in one view but physical `absent` plus review outcome in another.

**Action:** Decide which fields each audience may see, document it, and return a normalized view (`physicalStatus`, review state, explanatory label) where appropriate. Add guardian/self authorization and disclosure tests covering approved/rejected excuses and cross-organization relationships.

### P2 — data semantics need completion rules

`AttendancePolicy` includes `allowPartialSubmission` and `lateCountsAsPresent`, but the audit found no policy management path and manual/dorm writes can submit a subset of a roster. This may be intentional for progressive roll-call, but session status becomes `submitted` while unmarked members remain.

**Action:** Make the intended semantics explicit: draft vs submitted vs finalized, when partial marking is permitted, how unmarked students appear in reports, and who can close/finalize. Enforce the configured policy on the server and show the same rule in UI copy.

### P2 — test coverage is strong but has important blind spots

The API tests cover migrations, tenant isolation, retry/idempotency, stale revisions, DTO bounds, delegation, review races and HTTP gates. Admin tests cover the principal page, retry/discard behavior, staff pool/session panels, student privacy behavior and accessibility. Missing proof includes a real authenticated browser journey for every role, guardian mounting, production migration against a populated copy, shared realtime behavior, and cross-replica concurrency.

**Action:** Add Playwright role matrix tests (teacher, reviewer, dorm delegate, ordinary student, guardian, cross-org member), a seeded upgrade rehearsal, and two-instance realtime/concurrency integration tests.

## Prioritized delivery plan

1. **Capability reconciliation (P1):** Create the authority registry and parity tests; fix Admin timetable action gating.
2. **Lifecycle completion (P1):** Deliver explicit correction/finalization and policy endpoints/UI, with audit evidence and migration-safe defaults.
3. **Operational readiness (P0/P1):** Define production topology; replace/process-proof realtime and write coordination; run multi-instance and populated-data rehearsal.
4. **Performance/privacy hardening (P1/P2):** Cursorize staff reads, remove membership N+1s, then normalize guardian/self disclosure contracts.
5. **Acceptance evidence (P2):** Run role/device browser flows, production-like migration rehearsal and accessibility checks; record results in a dated addendum.

## Evidence inspected

- API: `apps/api/src/modules/attendance/`, `apps/api/src/modules/schedule/timetable.*`, `apps/api/src/modules/guardian/`, `apps/api/src/modules/realtime/realtime.service.ts`.
- Persistence/migrations: attendance entities and migrations from `1724148100000` through `1730500000000`.
- Authorization: `apps/api/src/modules/authorization/school-capabilities.ts` and school-role/capability grant migrations.
- Admin: `apps/admin/src/features/attendance/`, teacher portal attendance components, router and navigation.
- Contracts/tests: `packages/api-contract/src/attendance*.ts`, `apps/api/test/attendance*.spec.ts`, and Admin attendance/teacher tests.

## Validation performed for this audit

No code behavior was changed. Source and test inventory were inspected, including the named attendance test suites. I did not run the full test/build suite because this request is an audit/documentation task and the checkout contains unrelated active changes; the document does not treat existing tests as freshly passed.
