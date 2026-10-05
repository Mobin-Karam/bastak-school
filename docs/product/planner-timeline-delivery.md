# Planner timeline delivery and release evidence

## Timeline policy

Day and Week both render the same `DayColumn` timeline. Its centralized default
configuration is 05:00–23:00 with 30-minute slots. A day containing a valid
task outside that window automatically extends its own timeline in 30-minute
bands, so persisted early and late tasks remain discoverable.

The time ruler, grid bands, task position, and task height use shared planner
time helpers. RTL changes column layout only; it does not change clock math or
the `HH:mm` API value.

## Scheduling behavior

- Dragging calculates a target start locally and preserves duration by deriving
  a new end time.
- The API validates both task and destination-plan scopes. An empty destination
  day is created through the existing `ensurePlan` path before the move.
- Tasks may overlap. They render in side-by-side lanes and are not rejected.
- Mutations update optimistically. Failed moves roll back cached plans and show
  a Persian error notification.
- Read-only users cannot drag, drop, or add a task from the ruler.

## Server data integrity

Any supplied time uses strict `HH:mm` (00:00–23:59). With both bounds present,
the API rejects `end <= start` and recalculates `duration` from the range for
create, update, drag, and import paths. A client-supplied duration is not
authoritative when the range is known.

## Evidence and remaining release gates

Focused Admin tests cover early/late expansion, clock-position alignment,
invalid drag data, and optimistic movement. Backend service tests cover
malformed times, invalid ranges, and server-calculated durations.

`apps/admin/e2e/planner-drag.spec.ts` is the real browser/API/database drag
test. It provisions an isolated source plan and empty destination day through
the live API, drags through the rendered Week timeline, checks the persisted
range and duration, then reloads the Planner. Run it only with the disposable
database fixture: `PLANNER_E2E=1 ADMIN_V2_E2E_BASE_URL=... npm run test:e2e -- --grep "Planner drag persistence"`.

### Executed evidence (2026-09-29)

- The rendered Week E2E passed against a disposable API and SQLite database:
  source plan creation, an empty destination day, a 14:00 cross-day move,
  `15:30` calculated end, duration `90`, API re-query, Planner reload, and a
  direct SQLite query all agreed.
- A fresh SQLite database completed all 56 migrations, including
  `PlanningImportRichFields1724145300000`.
- On a separately fresh migrated and seeded SQLite database, authenticated
  `POST /api/v2/import/commit` followed by `GET /api/v2/export/json` preserved
  rich plan, task, exam, syllabus, and question metadata. The round trip
  asserted 11 fields, including task pages/conflict/exam reference, plan
  labels/motivation, exam instructions/syllabus, and question book/tags/order.
- Planner component tests cover rendered Day drag, rendered Week target
  calculation, empty-day start flow, invalid payload handling, and early/late
  timeline expansion. Backend plan, import/export, and sharing service tests
  pass.

The automated Week browser/API/database path, fresh migration chain, and rich
import/export round trip are complete. Manual device/browser drag verification
on the supported production browsers remains required before a full
production-readiness claim.
