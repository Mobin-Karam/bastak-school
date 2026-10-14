# Phase 4 — Scheduling engine acceptance

Date: 2026-10-14

## Implemented engine boundary

The versioned timetable in `apps/api/src/modules/schedule/timetable.service.ts`
is the schedule owner. It stores immutable published versions and derives
date-specific occurrences from the active version, bounded date overrides, and
holidays. It does not mutate a published weekly lesson to represent a
substitution, cancellation, time change, or room change.

The current engine validates before it writes:

- class, teacher, room, and period collisions, including concurrent terms;
- active school and capability scope for configuration, drafts, publishing,
  importing, and attendance;
- version revisions, term/year date boundaries, bell/session/period time
  boundaries, and organization ownership;
- a version replacement effective date, without retroactively changing an
  earlier published version.

The occurrence feed composes week transitions from the immutable published
versions, so a week that crosses a version effective date remains historically
correct. `TimetableChange` and `TimetableOverride` retain who changed a dated
occurrence and why; timetable audit records retain the action history.

## Role scope and attendance acceptance

The server filters non-privileged timetable feeds before returning lessons or
occurrences:

- students receive their active enrolled classes;
- guardians receive active enrollments of students with an active
  `GUARDIAN_OF` relationship;
- teachers receive their assigned lessons and dated substitute assignments;
- only `schedule.read.all` receives the school-wide management workspace.

Attendance is linked by `(lessonId, date)` to a schedule occurrence. Opening a
session is idempotent, rejects a cancelled, superseded, unpublished, or
non-current-day occurrence, and permits the effective teacher for that date.
When a dated change occurs after attendance was opened, the attendance service
is asked to preserve the historical session and require correction when
recorded observations make a reschedule unsafe.

Management users with `schedule.read.all` also receive a read-only
planned-versus-attendance report for a bounded date range. It counts scheduled
and cancelled occurrences, sessions opened from those occurrences, and
occurrences with at least one saved attendance record, with the same figures
grouped by class. The report derives from immutable occurrence and attendance
history; it never infers that a lesson was held or modifies either record.

## Regression evidence

`apps/api/test/timetable.service.spec.ts` now covers:

- published student, guardian, and teacher feeds;
- only the effective substitute teacher opening attendance for a dated
  substitution;
- attendance session reuse, cancellation preservation, and rescheduling
  safeguards;
- planned, cancelled, attendance-opened, and attendance-recorded aggregates,
  including the management-only capability boundary;
- concurrent-term collision detection, stale revisions, immutable publishing,
  and scoped drafts.

Validation run on 2026-10-14:

```text
cd apps/api && npm test -- --runInBand test/timetable.service.spec.ts
# 20 tests passed
cd apps/api && npm run lint
cd apps/api && npm run build
```

## Deliberate follow-up boundary

The engine is a constraint validator and versioned operational scheduler. It
does not claim to be an automatic timetable optimizer. If an optimization
phase is approved later, it must propose ranked alternatives without weakening
the existing server-side conflict and authorization gates.
