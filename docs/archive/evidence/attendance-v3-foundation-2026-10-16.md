# Attendance V3 foundation — 2026-10-16

This addendum records the implementation completed after the 2026-10-15 attendance audit. It is source/test evidence, not a production-deployment claim.

## Delivered

- **Absence-first submission:** `POST /attendance/sessions/:id/submit-absences` expands the immutable roster snapshot server-side. Omitted students become `present` only in the successful transaction; absent/late IDs are validated against the snapshot, and a student cannot be both.
- **Lifecycle:** submitted sessions can be finalized with optimistic revision control. An authorized, scoped reviewer can cancel an unmarked `scheduled`/`open`/`draft` session through `POST /attendance/sessions/:id/cancel`, with a reason, revision and audit event. Cancellation retains the session rather than deleting it; submitted/finalized facts require the correction workflow. Cancelled/finalized sessions cannot be submitted again, and a finalized session remains finalized when a correction is applied.
- **Corrections:** `PATCH /attendance/records/:id/correction` requires `attendance.correct`, a revision, request ID, physical status and reason. `AttendanceCorrection` is append-only persistence containing before/after values, actor, request ID, record/session references and reason; its `(record, actor, requestId)` uniqueness makes a network retry idempotent. Migration `1730600000000-AttendanceCorrections` is forward-only. `1731300000000-AttendanceCorrectionReview` adds a forward-only policy: when enabled, a correction remains pending evidence and changes no attendance fact until a scoped `attendance.review` actor approves or rejects it through `POST /attendance/corrections/:id/review`.
- **Policy:** organization attendance policy read/update endpoints are capability-gated by `attendance.settings.manage`; `allowPartialSubmission=false` is enforced by the server during marking. The existing Admin policy form now also configures whether corrections require reviewer approval.
- **Access parity:** `RequireAnyCapabilities` and the linked-session Admin route allow the timetable-assigned teacher’s `attendance.class.manage` to enter absence-first submission while service-level context/assignment checks remain authoritative.
- **Student privacy:** `/student/attendance` returns only the active account’s records in its active organization and excludes cancelled sessions.
- **Guardian privacy:** the existing linked-child endpoint retains its relationship enforcement, excludes cancelled sessions, and now returns physical attendance separately from excuse-review outcome.
- **Marker privacy:** `/attendance/my-absence-reviews` is limited to the marker's active organization even when that account belongs to multiple schools.
- **Management reporting:** `GET /attendance/reports/summary` counts finalized facts only. Cancelled and unmarked sessions are excluded from the attendance-rate denominator, and each organization's `lateCountsAsPresent` policy is applied to the numerator.
- **Report date range:** the existing management workspace now exposes its shared Jalali-capable date picker for an optional inclusive report range; it forwards bounded ISO `from`/`to` values to the already capability-gated summary endpoint and can restore the all-time view.
- **Report validation:** the summary endpoint rejects an inverted date range server-side before reading attendance facts; the UI picker bounds selection as an additional convenience rather than an authorization or integrity control.
- **Academic reporting:** summary reporting can filter finalized facts by immutable academic-year and term snapshot IDs, keeping a multi-year report independent from the current timetable configuration.
- **Dormitory marking:** delegated room attendance follows the same absence-first invariant as lessons. Residents remain `unmarked` in the mobile editor until confirmation; the final transaction persists every immutable room-roster member, treating only omitted members as `present`. This keeps an explicit all-present action and prevents a partial client payload from creating a partial dorm session.
- **Class and subject execution reporting:** the existing timetable attendance report now exposes planned/opened/recorded/cancelled totals both by class and by scheduled class book (subject), and the management timetable UI renders both summaries for the selected week.
- **Scoped history:** `GET /attendance/history/sessions` provides bounded server-side history pagination with organization, context, timetable-subject and date-range filters; an assigned teacher's SQL query contains only assigned class/group contexts.
- **Staff archive:** the existing management session archive now returns `{ items, page, limit, total, hasNext }` rather than a capped implicit list, and the Admin workspace exposes older/newer page controls.
- **Timetable meaning:** timetable-created sessions snapshot the linked class book's stable ID and Persian title. Migration `1731200400000-AttendanceSubjectSnapshots` is additive, so later catalog edits cannot rename historical lesson attendance.
- **Academic meaning:** timetable-created sessions now snapshot academic-year and term IDs plus names at opening time. Migration `1731300100000-AttendanceAcademicSnapshots` is additive and indexed, so later academic-calendar edits cannot rewrite the historical year/term attached to attendance.
- **Admin integration:** saved-session dialog supports finalization, reason-required cancellation for unmarked sessions, and a reason-required correction form; it renders the immutable academic-year, term and subject snapshots when available. When the approval policy is enabled it clearly reports that the request is pending and has not changed attendance yet. Review authorization is capability-first in the service, while tenant- and context-scoped correction, absence-review, and live-record reads ensure a non-school-wide reviewer sees only assigned contexts. Both absence-review and correction queues are mounted in the capability-gated existing session workspace, with documented approve/reject dialogs. Linked session rosters expose absent/late actions plus an explicit all-present confirmation. The shared roster now searches normalized Persian names and student numbers without clearing selections outside the visible results, including delegated dormitory marking. Existing request ID, toast, responsive dialog and capability patterns are reused.

## Verification run

- `npm run workspace:check` — passed.
- `npm run contracts:check` — passed.
- `apps/api: npm test -- --runInBand test/attendance.service.spec.ts -t "all-present"` — passed the explicit 30-member all-present transaction. The complete service suite did not finish within this environment's runner limit and is not recorded as a pass.
- `apps/api: npm test -- --runInBand test/attendance-lifecycle-migration.spec.ts` — 6 passed.
- `apps/api: node --experimental-vm-modules ... test/database-persistence-integration.spec.ts` — 18 passed after applying the additive subject-snapshot migration to the historical-schema fixture.
- `apps/api: npm test -- --runInBand test/attendance-operations.spec.ts test/capabilities.guard.spec.ts test/database-persistence-integration.spec.ts` — 38 passed.
- `apps/api: npm run build` — passed.
- `apps/admin: npm test -- --run AttendancePage/AttendanceStaffWorkspace/AttendanceReviewQueue` — 18 passed.
- `apps/api: npm test -- --runInBand test/timetable.service.spec.ts` — 21 passed, including subject-level attendance-report aggregation.
- `apps/api: npm test -- --runInBand test/attendance.service.spec.ts -t "holds a correction"` — passed; a pending correction leaves the attendance record unchanged until reviewer approval.
- `apps/api: npm test -- --runInBand test/attendance.service.spec.ts -t "cancels an unmarked"` — passed; a scoped reviewer cancellation writes audit evidence and blocks later absence-first submission.
- `apps/api: npm test -- --runInBand test/database-persistence-integration.spec.ts` — 18 passed after applying the correction-review migration to the historical-schema fixture.
- `apps/admin: npm test -- --run src/features/schedule/pages/TimetablePage.test.tsx` — 10 passed, including the subject summary in the management report.
- `apps/admin: npm test -- --run src/features/attendance` — 30 passed, including mobile-width absence-first selection preserved through a student-number search.
- `apps/admin: npm test -- --run src/features/attendance/components/AttendanceStaffWorkspace.test.tsx` — 7 passed, including reason-required cancellation in the existing session-detail dialog.
- `apps/admin: npm test -- --run src/features/attendance/api/attendance-operations.api.test.ts src/features/attendance/components/AttendanceStaffWorkspace.test.tsx` — 8 passed, including the inclusive date-range API contract.
- `apps/api: npm test -- --runInBand test/attendance-operations.spec.ts -t "inverted management report range"` — passed; `apps/api: npm run build` — passed.
- `apps/api: npm test -- --runInBand test/attendance.service.spec.ts -t "preserves the timetable subject snapshot"` — passed with year/term snapshot assertions; `apps/api: npm test -- --runInBand test/database-persistence-integration.spec.ts` — 18 passed after applying the additive academic-snapshot migration.
- `apps/admin: npm test -- --run src/features/attendance/components/AttendanceStaffWorkspace.test.tsx` — 8 passed, including the historical academic snapshot rendering.
- `apps/api: npm test -- --runInBand test/attendance-operations.spec.ts -t "immutable academic-year"` — passed; `apps/api: npm run build` — passed.
- `apps/api: npm test -- --runInBand test/attendance-operations.spec.ts` — 19 passed across attendance reporting, pools, dormitory delegation and scoped operations.
- `apps/admin: npm test -- --run src/features/attendance` — 34 passed across the attendance feature suite.
- `apps/admin: npm test -- --run src/features/attendance/components/StudentAttendanceWorkspace.test.tsx` — 5 passed, including explicit all-present dormitory confirmation and full-roster submission.
- `apps/api: npm test -- --runInBand test/attendance-operations.spec.ts` — 19 passed after the delegated-dorm full-roster transaction change; `apps/api: npm run build` — passed.
- `apps/admin: npm test -- --run src/features/attendance/components/AttendanceReviewQueue.test.tsx src/features/attendance/pages/AttendancePage.test.tsx` — 13 passed; the scoped absence decision flow and the attendance page both render without regression. A later focused page run passed 12 tests, including mounting both review queues in the sessions workspace.

## Known remaining work

- Long-range class/subject reporting reads are not yet cursor-paginated; the timetable execution view is deliberately bounded to a 32-day range and the management attendance summary is finalized-session-only.
- Attendance policy is available as a capability-gated section of the existing staff workspace rather than a parallel settings screen; it still needs browser/device acceptance testing.
- No two-replica realtime/SQLite concurrency proof, production migration rehearsal, or real browser/device role matrix was run.
- The complete Admin build remains blocked by unrelated SMS contract errors; the focused attendance UI suite passes.
