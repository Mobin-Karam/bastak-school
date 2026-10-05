# Education planning improvement

Reviewed: 2026-09-28. Owner: @Mobin-Karam.

This is the current product direction for the school/advisor planning workflow. It preserves the existing daily planner rather than replacing it.

## Delivered workflow

- An advisor or authorized staff member can choose one or many students from a searchable, visibly selected list.
- A plan can be copied for one day, a week, or a custom source date range. Destination dates retain the same day offsets from the chosen destination start date.
- Existing destination plans are preserved by default. An explicit replacement control is required before a copy can replace a student's plan and tasks.
- The API validates every selected recipient against the actor's `plans.create` scope before it starts the transactional copy. A recipient outside the organization or assignment scope fails the whole request rather than silently producing a partial cohort.
- A copied plan keeps its instructional metadata (title, Persian/Jalali labels, motivation, pages, linked-exam references, and conflict grouping) while deliberately resetting the recipient's task-completion progress.
- Task editing now prioritizes time/type and learning goal, shows calculated duration, and keeps optional pages, test count, and advisor notes behind progressive disclosure.
- Planner controls are independently capability-gated: creating a plan/task, editing, deleting, publishing, sharing, and importing/exporting are exposed only when the active role has the matching server capability. The API remains the final authorization boundary.
- Before committing a cohort copy, the share dialog calls a server-authorized preview that reports each destination's existing plans and overlapping task-time count. This is informational; the explicit conflict policy still controls the commit.
- Selecting the non-default overwrite policy requires a second acknowledgement in the Admin dialog; completed work remains protected by the server even after it is acknowledged.
- Every range-copy writes an `education.plan_range_shared` audit record containing actor, available single-organization scope, source/destination range, recipients, conflict policy, and copied/skipped counts. Staff can read their own records, a single-organization administrator can read that organization's records, and a platform administrator can read the cross-actor history through `GET /education-sharing/plan-history`.
- The Planner action menu exposes this history with loading, error, empty, and result states, so the operational audit is usable without direct API access.

The Admin UI is a convenience layer only. Scope and role checks remain server-authoritative, so teachers, advisors, and other workers see only students their active role is allowed to plan for.

### Planner role contract

| Role | Planner access |
| --- | --- |
| Teacher | Read the plans and tasks of assigned students. |
| Advisor | Read, create, edit, delete, publish, and share plans for assigned students. |
| Organization administrator | Full planner operations within the active organization. |
| Platform administrator | Full planner operations across permitted organizations. |
| Mentor / guardian | Read-only access where their active student relationship allows it. |

`PlanningRoleCapabilities1724145400000` makes the teacher, organization-admin,
and platform-admin parts of this contract durable for existing deployments.

## Education API surface (source-audited)

These endpoint families are the current authority for Admin education flows;
each is protected by the capability shown in its controller rather than by a
frontend-only role check.

| Capability area | API family | Admin surface |
| --- | --- | --- |
| Student education profile and cohort | `GET/POST/PATCH /students`, `GET /education-catalog/{signup-options,books,datasets}` | Students, Planner selection, Subjects |
| Daily and weekly planning | `GET/POST/PATCH/DELETE /plans`, `POST /plans/:id/{tasks,duplicate}`, `PATCH/DELETE /tasks/:id`, `POST /plans/publish-range` | Planner |
| Cohort plan/resource sharing | `POST /education-sharing/plans/:id/range`, `POST /education-sharing/learning-resources/:id` | Planner, Resources |
| Subjects and staffing | `GET/POST/PATCH /subjects`, `PATCH /students/:studentId/subjects/:subjectId`, `/subjects/:id/teachers` | Subjects |
| Exams, questions, assignments, attempts | `/exams`, `/questions`, `/question-bank/exams`, `/exam-attempt-requests`, `/students/:id/exam-attempts` | Education, Exams, Questions |
| Syllabus and quizzes | `/exams/:id/syllabus`, `/syllabus/:id`, `/quizzes`, `/quiz-questions` | Exams, Quizzes |
| Learning resources and learning records | `/learning-resources`, `/students/:id/learning` | Resources, Learning |
| Reports and family visibility | `/students/:id/reports`, `/guardian/students/:id/{dashboard,progress,schedule,exams,reports}` | Reports, Family |

Student-only routes under `/student/*` remain intentionally outside the Admin
surface; their server-side ownership checks must remain in place even when an
Admin feature links to the same educational record.

## Workflow guidance

1. Select the source student in Planner and choose **Share plan**.
2. Search, filter, and select the target students. “Select all shown” only affects the current visible filtered list.
3. Pick the source range and the first destination date. For a weekly plan, use the displayed week range; custom dates handle any shorter or longer teaching window (up to one year per operation).
4. Keep the default “preserve existing plan” unless the cohort has confirmed that replacement is appropriate.
5. Review the result count. A successful result distinguishes copied plans from plans deliberately skipped because they already existed.

## Education-system gaps and next work

| Priority | Gap | Practical next step |
| --- | --- | --- |
| P1 | Planning is student-centric but lacks a reusable, versioned school template library. | The implementation contract is [plan-template-library-contract.md](plan-template-library-contract.md): organization-owned templates, subject/grade tags, draft/review/publish states, immutable revisions, preview/apply, and clone provenance. |
| P1 | A dedicated cohort workload dashboard is not yet persisted. | The sharing preview now aggregates empty destination days, overlapping sessions, capacity overruns, proposed hours, and exam collisions; add saved dashboard views only if operations need longitudinal comparisons. |
| P1 | Teachers, advisors, and other staff need clearer responsibility boundaries. | Model staff-to-student assignments and role-specific capabilities explicitly, then show an understandable reason when an action is unavailable. |
| P2 | Students need a clear response loop after a plan changes. | Show “plan updated by advisor,” a compact change summary, acknowledgement, and a safe request-for-adjustment flow. |
| P2 | Families need consented, limited visibility rather than broad access. | Add guardian preferences and a read-only weekly summary subject to server-side relationship scope. |

## UX acceptance checklist

- The selector works with keyboard, screen reader labels, Persian search text, narrow screens, and large cohorts.
- The share dialog has clear empty, loading, unavailable-role, failed-request, and completed-result states.
- Replacement is never the default and is visually distinct from normal sharing.
- A student never sees a plan as delivered until the server accepts it; offline state remains explicit in the Student app.
- Admin and Student changes are tested separately at RTL/mobile widths, and organization/role boundaries are verified by API tests.

## Evidence boundary

Current automated proof covers TypeScript/build-facing contracts and focused service behavior. It does not prove a deployed organization, a real staff cohort, or native Student delivery. Before release, run an authorized browser journey with an advisor role, a multi-student cohort, an existing-plan conflict, and Student-side visibility on the target environment.
