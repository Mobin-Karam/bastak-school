# Attendance, room representatives, and live gatherings

## Delivered behavior

The attendance page follows `apps/admin/public/12.png` and `13.png`: larger target cards, four colored status tiles, separate student cards, and a clear review/save footer. Staff navigate Classes, Class Groups, Dormitory, Sessions, and Pool from the top. Class-group attendance starts with a class and then its groups. Rosters use a mobile bottom drawer and a desktop modal. Search and attendance date pickers are removed; attendance timestamps are captured at submission, with the original timestamp and request ID retained on a timeout retry.

Sessions and pools are filtered by class/group/room. New manual sessions capture the complete roster, preserving names and missing marks after membership changes. Old sessions without a roster remain explicitly unknown; current membership is never substituted for historical facts. Session details distinguish absence from unconfirmed/unmarked attendance. Unanswered pool prompts are not fabricated into absence records.

A principal/supervisor with `attendance.delegate` can select one current, active resident account as room representative and choose an inclusive date window (one night to one year). Reassignment replaces the current responsibility and is audited. Student accounts gain no global staff role or attendance capability. The dedicated delegated writer checks the selected account, school membership, current residency, room, date window, current night, roster membership, batch bounds, request identity, and expected session revision on the server. Past/future-night writes and post-revocation retries are rejected. Representatives see only names/IDs for the authorized room roster.

Principals/supervisors with `attendance.review` and `attendance.manage` create a Pool (live gathering) for a class, group, or room, with a title, place, and a 1–240 minute deadline. The roster is fixed when opened. The student shell displays a prompt, also available from the student's attendance page. Check-in uses the authenticated student's identity; a supplied student ID is rejected. Check-in is idempotent and closes at the deadline or a staff close action. These are self-reported confirmations, not location verification.

The school-manager home and attendance overview use a half-open daily window from 16:00 to the following 16:00 in `Asia/Tehran`, calculated on the server. A refresh at the boundary changes totals without deleting/resetting sessions, records, or profiles. The existing 04:00 operational-day policy for scheduled attendance is not changed. Delegated room attendance uses the 16:00 boundary to identify the current night.

Detailed profiles require both a staff capability and an eligible active staff role, and remain school-scoped. Student accounts get aggregate counts and an improvement/encouragement message. The legacy self-record endpoint remains available as an empty array, and the legacy self-summary returns no detailed `recent` records. This is the explicit privacy change requested for this feature.

## Persistence and rollout

`1730400000000-AttendanceDelegatesAndPools` adds `dorm_attendance_delegates` and `attendance_pools` only. Existing attendance data is untouched. Foreign keys, one representative per room, one pool per saved session, and valid date ordering are enforced. Empty-schema rollback is supported; rollback refuses to discard populated delegation/gathering history. Deploy migrations and API routes before the updated frontend. No root dependency/lock/workspace migration is required.

The local development database was inspected read-only: the migration is applied and attendance permissions exist for principal/supervisor roles. It was not modified by verification; integration tests use in-memory SQLite.

Polling backs up targeted realtime notifications. The student shell polls active pools every ten seconds, and staff views refresh periodically. HTTP previews use cryptographic UUID v4 generation via `getRandomValues` if secure-context-only `randomUUID` is unavailable. Retries preserve request identity.

The separate `apps/student` application is absent from this checkout. The student experience is implemented in the existing Admin application's student account shell/routes. Shared contracts are exported for other clients. Session/profile lists currently display the latest 200 items; aggregate counts include all matching saved records.

## Validation

Behavior tests cover HTTP pool creation/check-in validation, scoped delegation, one representative per room, expiry/revocation, membership changes, version conflicts, timeout retries, duplicate/concurrent check-ins, foreign schools, student profile privacy, the 16:00 boundary, saved rosters, and additive migration/rollback safety. Frontend tests cover responsive rostering, current-time marking, filter-only controls, delegated marking, automatic pool prompts, creation retries in HTTP previews, missing-member details, and automated accessibility of the staff workspace.

Repository-wide baseline checks currently report missing `apps/student/package.json`, architecture violations outside attendance, and workflow-spec constructor errors. The broader Admin suite also has failures in navigation, locale/date-picker, registration, and dashboard accessibility. These are not suppressed or treated as successful validation.

### Final verification

- Backend attendance/session, operations/HTTP, migration, and school-time suites: **55 tests passed in 4 suites**.
- Focused frontend attendance and student dashboard suites: **22 tests passed in 8 files**.
- Admin type checking and API/Admin production builds: **passed**.
- ESLint for changed attendance and dashboard/shell files, focused Prettier checking, and scoped diff whitespace check: **passed**.
- Automated staff-workspace accessibility is included in the focused frontend suite. Browser/device end-to-end testing with a real authenticated account was not performed.
- The broad Admin run had 124 passing and 9 failing files before the final focused fixes; it is not reported as a green full-suite run. Repository/workspace and global API-lint limitations remain as described above.
