# Migration preservation coverage

`scripts/deploy/database-recovery.cjs` verifies an isolated copy of a live
SQLite database before a candidate deployment can replace the running
application. It compares every original logical record and fails closed for an
unrecognised added column. This document records the intentionally narrow
exceptions for the migrations exercised by the production upgrade rehearsal.

| Migration                                          | Table and change                                                                                               | Existing-row value                                           | Validator rule                                 |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------- |
| `AcademicSchedulingFoundation1730900000000`        | `education_classes.academicYearId`                                                                             | `NULL`                                                       | Nullable `NULL` only                           |
| `AcademicSchedulingFoundation1730900000000`        | `timetable_periods.weekdays`                                                                                   | SQLite default `[]`                                          | Exact default only                             |
| `TimetableImportIdempotency1731000000000`          | `timetable_imports.fingerprint`                                                                                | `legacy-<id>` backfill                                       | Exact legacy-id transform                      |
| `TimetableImportSourceRows1731100000000`           | `timetable_imports.sourceRows`                                                                                 | SQLite default `[]`                                          | Exact default only                             |
| `AttendanceSubjectSnapshots1731200400000`          | `attendance_sessions.subjectIdSnapshot`, `subjectNameSnapshot`                                                 | `NULL`                                                       | Nullable `NULL` only                           |
| `AttendanceCorrectionReview1731300000000`          | correction-policy and correction-review columns                                                                | Migration defaults or `NULL` as declared                     | Exact declared default or nullable `NULL` only |
| `AttendanceAcademicSnapshots1731300100000`         | `attendance_sessions.academicYearIdSnapshot`, `academicYearNameSnapshot`, `termIdSnapshot`, `termNameSnapshot` | `NULL`                                                       | Nullable `NULL` only                           |
| `AttendanceCorrectionReviewIntegrity1731300300000` | `attendance_corrections.reviewedById`                                                                          | Set to `NULL` only when the referenced user no longer exists | Explicit `null-if-missing-user` repair         |

No migration is approved by a wildcard, a table name, or a column type alone.

## Upgrade rehearsal coverage

`scripts/deploy/prepare-upgrade-rehearsal.cjs` now creates a database at the
schema immediately before all of the migrations listed above, inserts a
representative pre-existing organization and class, and lets the candidate
image apply the pending chain. The recovery validator then checks the copied
database before the compose deployment proceeds.

The database-recovery unit tests additionally prove that:

- subject and academic snapshot columns must remain `NULL` for pre-existing
  attendance sessions;
- any non-`NULL` snapshot value is rejected;
- only a dangling correction reviewer may be cleared; and
- an existing reviewer or any unrelated existing value remains protected.

## Operating boundary

This is an isolated preflight only. It must run against the restored backup,
never the live SQLite volume. A failure prevents replacement of the running
containers; it is not a signal to remove data, bypass the validator, or alter
the production snapshot.
