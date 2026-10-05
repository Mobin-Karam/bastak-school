# Organization student oversight

## Purpose

The Organization Admin dashboard answers a practical question: which active
organization students need a human check today, and why? It is an operational
triage view, not a staff-performance scorecard.

## Actor and scope

- Actor: an authenticated user in the `ORGANIZATION_ADMIN` dashboard context.
- Server scope: only students whose user has an `ACTIVE` membership in one of
  the caller's organization IDs.
- Multi-organization accounts use the union of those active memberships; a
  student is counted once, not once per matching membership row.
- Relationship scope: advisor coverage is counted only for an active
  `ADVISOR_OF` relationship in the same organization.
- The browser receives a bounded roster of six students. It never derives
  organization membership, task status, or advisor coverage itself.

## Signals and meaning

| Signal | Meaning | Follow-up |
| --- | --- | --- |
| No plan today | No published plan exists for today. | Open the student's Activity tab; then review planning ownership. |
| No completed task | A published plan has tasks but none are complete. | Open Activity and check the task timeline. |
| No daily report | No daily report exists for today. | Ask the student or advisor for context; it is not proof of inactivity. |
| Failed sync | Presence reports a failed sync. | Open Activity and resolve device/network follow-up first. |
| Open student issue | The student has an open task issue. | Open Activity or the operational queue. |
| Pending recovery | A recovery request awaits a decision. | Open the operational queue. |
| No active advisor | No active, organization-scoped advisor relationship exists. | Assign or restore the appropriate relationship in People and access. |

The dashboard also includes a seven-day completion aggregate for published
plans. It is a trend context for the organization, not an individual alert and
does not imply a staff-performance rating.

The separate **Today’s plan health** widget shows the current day’s published,
planned, and completed task totals so an administrator can compare immediate
execution with the seven-day context.

The active advisor coverage rail shows only how many students each active
advisor relationship covers. It helps a manager spot a missing or uneven
assignment distribution, but it does not measure advisor quality or effort.

The roster sorts recovery requests, task issues, and failed syncs before plan,
completion, report, and advisor-coverage gaps. This keeps urgent operational
work visible when the roster is bounded.

## Flow

1. Open **Dashboard** as Organization Admin.
2. Scan the summary metrics for coverage and reporting gaps.
3. Open **Students needing a check today**.
4. Select a student to open `/admin/students?studentId=…&tab=activity`.
5. Resolve the underlying record in the student Activity view, follow-up queue,
   planner, or organization relationship workspace.
6. Refresh the dashboard after the action; the server re-evaluates all signals.

## States

- Loading: the dashboard workspace keeps the existing loading surface.
- Empty: a specific message confirms that no active organization student meets
  a displayed signal.
- Error: existing dashboard retry refreshes the summary and work queue.
- Permission: the dashboard context is rejected server-side when the requested
  role is not active for the account.
- RTL/LTR: all text is provided through dashboard locale copy; layout uses
  logical utility classes and the student deep link is locale-independent.

## Deliberate limits

- A missing report or plan is a follow-up signal, not a finding that a student
  or staff member failed their job.
- The dashboard does not rank staff performance. That would require explicit,
  agreed ownership and workload definitions that the current domain model does
  not provide.
- A student may have more than one educational relationship; the dashboard
  currently measures only advisor coverage because that is the planning
  relationship used by the existing study-session workflow.
