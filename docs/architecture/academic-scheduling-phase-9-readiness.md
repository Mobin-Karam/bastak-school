# Phase 9 — Academic scheduling readiness audit

Date: 2026-10-14

## Verified in this worktree

| Area | Evidence | Result |
| --- | --- | --- |
| Versioned schedule and attendance integrity | `apps/api/test/timetable.service.spec.ts` | 21 passing integration tests |
| Disposable SQLite migration and recovery rehearsal | academic foundation, import idempotency, and persistence migration suites | 21 passing tests |
| Import parsing, mapping, confirmation, and client validation | timetable workbook/mapping/wizard tests | 10 passing focused Admin tests |
| Responsive principal/student timetable workflows | `TimetablePage.test.tsx` | 10 passing tests |
| API types and capability declarations | `npm run contracts:check` | passed |
| Backend compile | `apps/api: npm run lint`, `npm run build` | passed |
| Admin compile and production bundle | `apps/admin: npm run typecheck`, `npm run build` | passed |
| Repository dependency graph | `npm run workspace:check` | passed |
| Markdown links and document health | `npm run docs:check` | passed |

The server remains the authority for organization scope, version state,
occurrence identity, attendance opening, and import commit. The UI does not
receive a capability that would bypass those checks.

## Verified operational scenarios

- draft revisions prevent stale timetable edits;
- publishing is immutable; dated overrides preserve historical versions;
- teacher, class, room, availability, and time-interval conflicts are checked;
- import commits are transactional, explicit, fingerprint-idempotent, and
  retain bounded source provenance;
- a guardian can retrieve only a linked child’s occurrence feed;
- a substitute teacher may open attendance only for the effective dated
  assignment; the original teacher is rejected after substitution;
- attendance reports distinguish scheduled, cancelled, session-opened, and
  record-entered occurrences without altering historical rows.

## Remaining release evidence

The following are intentionally not claimed as complete from this checkout:

- a real browser session at mobile/tablet/desktop breakpoints;
- a deployed API/database migration rehearsal with a production backup (the
  disposable SQLite migration/recovery rehearsal is verified above);
- importing the supplied ambiguous workbook into a real school draft after
  staff have mapped identities and repaired its malformed time labels;
- a live notification-provider delivery check;
- performance measurements with hundreds of classes and teachers.

These are deployment or operator exercises, not checks that can be inferred
from source compilation. The importer blocks unresolved rows and never
publishes automatically, so the workbook can be reviewed safely before such a
rehearsal.
