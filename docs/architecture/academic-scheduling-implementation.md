# Academic scheduling backend implementation

This change extends the existing modular monolith and `/api/v2` contracts. It does not replace authentication, the capability guard, school access, classes, education catalog, versioned timetables, attendance, or database technology. Schools remain `Organization` records of type `SCHOOL`; teachers remain scoped active user role assignments.

## Changes and ownership

| Owner / files | Behavior |
| --- | --- |
| `apps/api/src/modules/school-education/academic.{controller,dto,service}.ts` | Scoped paginated teacher directory, dated class/subject teaching assignments, explicit ending with a reason, subject/textbook references, transactional audit. |
| `apps/api/src/database/entities/academic-structure.entity.ts` | `TeachingAssignment`, `SubjectBookReference`, append-only `ClassEnrollmentHistory`. |
| `apps/api/src/modules/classes/classes.{controller,dto,service}.ts` | Nullable academic-year relationship, year scope validation, protection against remapping a referenced class, enrollment history alongside the existing current roster projection. History requires roster management capability. |
| `school-education.module.ts` | Reuses the existing Subject entity in school-scoped academic APIs. Retired `/subjects` routes remain unmounted. Subjects retain separate identities from books. |
| `apps/api/src/modules/schedule/timetable.{controller,dto,service}.ts` | Paginated version/history/occurrence queries, class/teacher/student/room/year filters, daily/weekly/date-range feeds, draft archiving, bounded transactional bulk preview/commit, cached bulk reference loading. |
| `apps/api/src/modules/schedule/timetable-domain.ts` | Period and weekday bounds, positive room capacity, actual occurrence existence, per-date conflict identity, allocation coverage over complete instructional weeks. |
| `apps/api/src/modules/schedule/schedule.service.ts` | Existing legacy schedule import commits atomically with scoped import history. |
| `apps/api/src/modules/attendance/attendance.service.ts` | Synchronizes unrecorded linked attendance when a lesson is canceled, restored, rescheduled within its date, or reassigned. Recorded teacher/time corrections return `ATTENDANCE_CORRECTION_REQUIRED`; observations are retained. |
| `apps/admin/src/features/education/api/{academic,classes}.api.ts`, `features/schedule/api/timetable.api.ts` | Typed clients for the additive endpoints using the existing work-context/CSRF API transport; bulk bodies allowlist writable lesson fields. No new UI screens are introduced. |
| `packages/api-contract/src/{academic-structure,timetable,index}.ts` | Additive shared academic types, pagination/filter/bulk types, period weekdays and conflict codes. |

A teaching responsibility can span the same dates as responsibilities for other classes. Duplicate overlapping teacher/class/subject responsibilities are rejected. Actual teacher time conflicts are checked against occurrences, including substitutions and executing approved versions of parallel terms. Class and room overlaps use the same actual-time checks. SQLite writes use the existing serialized `attendanceTransaction` helper; revision checks reject stale draft writes. No new reusable CMB package was introduced.

Published schedules remain immutable at the recurrence level. A future successor archives the older approved version without removing its earlier execution interval. Dated overrides are permitted only within the selected version's execution interval. Backdated publication that would supersede approved history is rejected. Calendar and class-section changes cannot silently alter approved history. Unpublished archived drafts are never treated as approved schedules.

## Additive endpoints

All paths below are prefixed by `/api/v2`. Existing endpoints are retained; responses use the existing envelope.

| Method / path | Capability and behavior |
| --- | --- |
| `GET /school-education/:organizationId/subjects` | `education.catalog.read`; active scoped subjects, paginated. |
| `POST /school-education/:organizationId/subjects` | `education.catalog.manage`; scoped unique normalized code, explicit Persian label. |
| `GET /school-education/:organizationId/teachers` | `classes.read` plus full schedule read or class management; sanitized active teacher identities. |
| `GET /school-education/:organizationId/teaching-assignments` | `classes.read`; limited readers see their own assignments. |
| `POST /school-education/:organizationId/teaching-assignments` | `classes.manage`; requires explicitly scoped class/year/term/subject/teacher and date bounds. |
| `PATCH /school-education/:organizationId/teaching-assignments/:id/end` | `classes.manage`; dated explicit ending, blocked while dependent draft/approved lessons extend beyond the end. |
| `GET /school-education/:organizationId/subject-books` | `education.catalog.read`; paginated explicit references. |
| `POST /school-education/:organizationId/subject-books` | `education.catalog.manage`; idempotent scoped subject/published-book link. |
| `GET /classes/:id/enrollments/history` | `classes.roster.manage`; paginated before/after student IDs and actor/timestamp. |
| `GET /schedule/timetable/:organizationId/versions` | `schedule.read`; approved versions only for limited readers; year/date filters; explicit inactive-year occurrence reads are supported. |
| `GET /schedule/timetable/:organizationId/occurrences` | `schedule.read`; `versionId`, `classroomId`, `teacherId`, `studentId`, `locationId`, `academicYearId`, `view`, `startsOn`, `endsOn`. Server enforces existing teacher/student/guardian visibility. Maximum 31 days. |
| `GET /schedule/timetable/versions/:id/history` | `schedule.read.all`; paginated explicit changes. |
| `GET /schedule/timetable/versions/:id/conflicts` | `schedule.read.all`; scoped conflict report, including parallel terms. |
| `POST /schedule/timetable/versions/:id/archive` | `schedule.archive`; unused drafts only, reason plus expected revision. Approved predecessors archive on publication as before. |
| `POST /schedule/timetable/versions/:id/bulk/preview` | `schedule.update` and each item's create/update capability; validates final candidate state without writes. |
| `POST /schedule/timetable/versions/:id/bulk` | Same capabilities; 1–100 items, maximum 500 lessons per version, all records and revision commit together. |

Pagination uses `offset` and `limit`; academic and history defaults are 0/50. Academic maximum is 100 and timetable maximum is 200. Date values are Gregorian `YYYY-MM-DD`; Persian display labels are preserved separately. Weekdays retain the existing JavaScript convention (Sunday 0). `period.weekdays=[]` means every weekday; explicit weekday sets allow different daily bell arrangements.

Bulk body: `{ expectedRevision, items: [{ id?: existingLessonId, lesson: existingTimetableLessonDTO }] }`. Existing single-lesson creation/update/preview, publication, imports, overrides and attendance-opening endpoints remain supported. Lesson reassignment uses the existing teacher field; a different primary teacher requires an explicit dated teaching assignment through the subject/book reference.

## Migration and safe rollout

`1730900000000-AcademicSchedulingFoundation.ts` adds three tables, nullable `education_classes.academicYearId`, and `timetable_periods.weekdays` defaulting to `[]`. It adds scoped composite foreign keys for assignment year/class/term, reference uniqueness, read indexes, and one-active-year-per-school uniqueness. Existing classes remain unassigned to a year: no historical label is guessed or backfilled. Existing roster data and lesson IDs are retained.

SQLite existing-table changes use native `ALTER TABLE ADD COLUMN`; TypeORM's parent table reconstruction is deliberately avoided because it can cascade child deletion. The populated upgrade regression verifies enrollments, books, lessons, custom indexes and triggers, FK enforcement, and a failed preflight rollback. New tables use TypeORM table/FK/index APIs. The new migration has PostgreSQL-aware timestamp/boolean handling, but the repository's complete historical SQLite migration chain has not been certified on PostgreSQL.

Before rollout, take and verify the established online backup on an isolated copy, run the normal integrity audit, and check for multiple active academic years. The migration fails without repairing such records; an operator must explicitly resolve them. Run migrations under the current `migrationsTransactionMode=each`, then deploy compatible application code. Map class academic years and subject/book references explicitly before using new teaching assignments. Do not automatically import ambiguous workbook labels or unresolved teacher identities.

Rollback application code while retaining the additive schema. Migration `down` refuses to destroy assignment/enrollment history. Restore a database backup only through the established verified recovery process and only with a plan for writes made after that backup. No production database or deployment was touched by this implementation.

## Verification

Tests cover migration-built SQLite workflows, whole-batch rollback, stale revisions, class/teacher/room collisions, parallel terms and isolated term holidays, future-version transitions, dated availability, period/weekday limits, room capacity, no-occurrence intervals, attendance protection, publication visibility, authorization, enrollment-history preservation, scoped assignments, subject/book identity, and malformed DTOs. Historical persistence fixtures use their historical SQL column list rather than inserting today's entities into an old schema.

## Remaining limitations

- Versioned lessons retain the existing required `classBookId` and single primary `teacherId` contract. Subject-only lessons and simultaneous co-teachers require the next compatible domain expansion; no fabricated textbooks or production IDs are generated.
- Overrides reschedule within a date. Moving an occurrence to another date requires explicitly canceling the source date and creating a date-bounded lesson in a new draft/version; there is no atomic cross-date move API.
- Period and lesson execution require explicit valid times. Uncertain Excel times remain in staging for review; afternoon times are never inferred. There is no uncertain-time persistence or publication bypass.
- Enrollment history starts with mutations after this migration. It records explicit roster snapshots, not fabricated historical start/end dates. Existing student timetable reads still use the current enrollment projection.
- Legacy undated entries remain compatible and separate from versioned scheduling; they are not retroactively assigned academic years or incorporated into versioned conflict enforcement.
- PostgreSQL and multi-process deployment conflict serialization need a dedicated database-adapter validation phase; current executable coverage targets the supported SQLite production model.
