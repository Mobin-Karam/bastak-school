# System feature audit

Status: source audit on 2026-10-09. This document describes code that is mounted or routed in the current checkout; it is not a production acceptance report.

## System shape

| Surface                 | Technology                    | Confirmed responsibility                                                                                               |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `apps/api`              | NestJS + Fastify + TypeORM    | Versioned school API, authentication, capability enforcement, workflows, realtime and persistence composition root.    |
| `apps/admin`            | React + Vite + TanStack Query | Capability-aware operational workspace for staff, principals, supervisors, teachers and student/guardian portal modes. |
| `packages/api-contract` | TypeScript                    | Shared role, capability and transport contracts.                                                                       |
| `student-core`          | TypeScript                    | Runtime-neutral student domain/provider package.                                                                       |
| `apps/student`          | —                             | Not present in this checkout. Do not describe a runnable Student web/PWA application as currently available here.      |

The API is a modular monolith. It mounts at `/api/v2`; `/health` and `/ready` are unprefixed. The OpenAPI specification is served at `/api/v2/openapi.json` and interactive documentation at `/api/v2/docs`.

## Cross-cutting behavior

- **Security:** HttpOnly session/refresh cookies, CSRF protection for mutations, role and capability guards, DTO whitelisting with non-whitelisted fields rejected, Helmet and configured CORS.
- **Authorization:** UI route/action gating is supplementary. API controllers use `@RequireCapabilities(...)`; organization and student scope are enforced in services.
- **Realtime:** user-targeted server events include notifications, chat and school occupancy updates. Admin notification handling refreshes query state and can display alerts.
- **UI foundation:** Admin uses shared cards, buttons, fields, notifications, locale/direction support, dark theme support, and focus-managed modal dialogs.

## API capability inventory

| Area                      | Confirmed API capabilities                                           | Main operations                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Identity and access       | CMB auth/identity/authorization, organizations, users                | Login/session context, phone/password identity, organization membership, active role/organization context, capability evaluation. |
| Students and registration | `students.*`, `registration.*`, `student_onboarding.manage`          | Student administration, registration workflow, structured education profile, organization-controlled onboarding.                  |
| Education catalog         | `education.catalog.read/manage/publish`, `education.operations.read` | Managed textbooks, draft/publish/archive lifecycle, impact lookup, class compatibility, education operations overview.            |
| Classes and groups        | `classes.read/manage`, `classes.roster.manage`, `class_groups.*`     | Class CRUD, class books/teachers, advisor, students, grouping and enrollment.                                                     |
| Attendance                | `attendance.*`                                                       | Attendance contexts, sessions, records and school/class/group/dorm views.                                                         |
| Workflow requests         | `leave.*`, `exit.*`, letters and permissions                         | Student leave, exit permission, returns, review decisions, request letters and reviewer scope.                                    |
| Dormitory                 | `dormitory.read/manage`                                              | Rooms, buildings/floors, capacity and assignments.                                                                                |
| Schedule                  | `schedule.read/create/update/delete/archive/import/export`           | Weekly schedule entries, role-scoped views and spreadsheet transfer.                                                              |
| Communication             | `chat.*`, notifications, realtime                                    | Direct/group chat, moderated conversations, notifications, SSE events and push integration where configured.                      |
| Guardian/family           | `guardian.*`, relationships                                          | Guardian links and scoped student/schedule/attendance access.                                                                     |
| School home and settings  | announcements, prayer times, school home                             | School dashboard data, announcements, prayer/current-time content and organization-facing home surfaces.                          |
| Platform operations       | system, import/export, audit, health                                 | System status, data transfer foundations, audit/activity and health/readiness endpoints.                                          |

## User types and roles

The shared contract declares these role codes: `STUDENT`, `GUARDIAN`, `ADVISOR`, `TEACHER`, `MENTOR`, `CONTENT_MANAGER`, `ORGANIZATION_ADMIN`, `PLATFORM_ADMIN`, `SCHOOL_ADMIN`, `SCHOOL_SUPERVISOR`, `PRINCIPAL`, `DISCIPLINARIAN`, `RELIGIOUS_EDUCATION_MANAGER`, `GOVERNMENT_EDUCATION_MANAGER`, `STUDENT_AFFAIRS_MENTOR`, and `COUNSELOR`.

| User type                                    | Scope and endpoint families                                                                                                                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Student                                      | Own profile/registration, own attendance, schedule, leave/exit requests, learning, plans, exams/quizzes, tasks and notification endpoints where the required student capability is present.         |
| Guardian                                     | Linked students only: `/guardian/students/*` for dashboards, progress, schedule, attendance, exams, reports and encouragement.                                                                      |
| Teacher / Mentor / Advisor / Counselor       | Organization-scoped staff work based on individual capabilities: students, education, class visibility, attendance, schedule, chat and designated review flows.                                     |
| Principal / School supervisor / School admin | School-scoped operational roles. Principals review principal-routed leave requests; supervisors review supervisor/gate exit flows. Actual authorization remains capability plus organization scope. |
| Organization administrator                   | Organization users, membership, classes, students, catalogs and enabled features when granted.                                                                                                      |
| Platform administrator                       | Cross-organization platform operations; not an organization-scoped membership role.                                                                                                                 |

There is no safe endpoint authorization rule based only on a visible role label. Each protected operation is evaluated against the authenticated user's role context, capabilities and server-side organization/student scope.

## Mounted controller and endpoint catalog

All paths below are prefixed by `/api/v2` unless labelled **unprefixed**. Capability names are controller gates; service-level scope checks can impose additional restrictions.

| Controller / module      | Endpoint groups                                                                                                                                                                                                                            | Primary gate                                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Health                   | `GET /health`, `GET /ready` (**unprefixed**)                                                                                                                                                                                               | Public health/readiness.                                                                                                                                                               |
| Auth and account         | `POST /auth/login`, `/refresh`, `/logout`; `GET /auth/me`; password, phone and session endpoints; `GET /me/context`                                                                                                                        | Session/CSRF for mutations; account-change-review gates for staff review.                                                                                                              |
| Onboarding               | `/onboarding/*`, including platform bootstrap and student signup/assignment                                                                                                                                                                | Public bootstrap/signup endpoints where explicitly exposed; otherwise onboarding/student capabilities.                                                                                 |
| Students                 | `/students`, `/students/:id`, `/students/me`, profile and administration endpoints                                                                                                                                                         | `students.read/create/update/archive` and student self capabilities.                                                                                                                   |
| Registration             | `GET /registration/self`, profile update, staff registration/review endpoints                                                                                                                                                              | `registration.self.*` or `registration.*`.                                                                                                                                             |
| Education catalog        | `GET /education-catalog/signup-options`, `/books`, `/my-books`, `/datasets`; `/admin/overview`, `/admin/books`, `/admin/books/export`, import preview/commit, create/update/publish                                                        | Student profile, subjects, catalog read/manage/publish and education-operations gates.                                                                                                 |
| Classes                  | `GET/POST/PATCH/DELETE /classes`; `/classes/:id/options`; `PUT /classes/:id/books`; `PUT /classes/:id/enrollments`; `/classes/assigned`; `POST /classes/transfer/preview`; `POST /classes/transfer/commit`; `GET /classes/transfer/export` | `classes.read/manage`, `classes.roster.manage`; class books use `education.catalog.manage`. Transfer preview, commit, and export are organization-scoped and require `classes.manage`. |
| Class groups             | `/class-groups/*`                                                                                                                                                                                                                          | `class_groups.read/manage`.                                                                                                                                                            |
| Attendance               | `/attendance/*`, bulk mark, student summary/records and student-specific summaries                                                                                                                                                         | `attendance.read/manage` or `attendance.self.read`.                                                                                                                                    |
| Workflows                | Student and staff `/leave-requests`, `/exit-permissions`, movement/return endpoints and request letters                                                                                                                                    | `leave.*`, `exit.*`, with reviewer role and organization checks.                                                                                                                       |
| Dormitory                | `/dormitory/rooms`, room assignments, students and announcements                                                                                                                                                                           | `dormitory.read/manage`, `announcements.manage`.                                                                                                                                       |
| Schedule                 | `/schedule`, `/:id`, `/:id/archive`, import preview/commit and export                                                                                                                                                                      | `schedule.read/create/update/delete/archive/import/export`.                                                                                                                            |
| Guardian                 | `/guardian/students`, then `/:id/dashboard                                                                                                                                                                                                 | progress                                                                                                                                                                               | schedule | attendance | exams | reports | encouragement` | Respective `guardian.*` capability and linked-student scope. |
| School home              | `/school-home/*` and school-facing announcement/prayer data                                                                                                                                                                                | School-home, announcement and prayer capabilities.                                                                                                                                     |
| Relationships            | Guardian selection/linking and organization relationship endpoints                                                                                                                                                                         | Relationship/guardian server scope.                                                                                                                                                    |
| Student transfer         | Student import preview, commit, export/history endpoints                                                                                                                                                                                   | Transfer/import/export capabilities and organization scope.                                                                                                                            |
| Import/export            | Feature-owned import/export support endpoints                                                                                                                                                                                              | Import/export capability gates and DTO allowlists.                                                                                                                                     |
| Dashboard                | Dashboard home, role dashboard and operational summary endpoints                                                                                                                                                                           | Authenticated role/capability-specific data.                                                                                                                                           |
| Chat                     | Conversations, messages, groups, moderation/profile routes                                                                                                                                                                                 | `chat.read/send/group.create/group.manage/moderate` plus membership checks.                                                                                                            |
| Notifications and events | `GET /notifications`, read/read-all; `/events` SSE; push subscription/config/status endpoints                                                                                                                                              | Authenticated-user ownership; push/session controls.                                                                                                                                   |

### Source controllers not mounted by `AppModule`

These controllers exist in source but are not directly included in the current school composition root unless reached transitively by another mounted module. Treat their routes as **not live until module wiring is verified**: Activity, Analytics, Assessments, Education sharing, Exams, Learning resources, Mistakes, Permission requests, Plan templates, Staff plans, Question bank, Relaxation, Reports, Reviews, Student documents, Study sessions, Subjects, Sync, System and Tasks.

Their source endpoint families include assessment/exam/quiz CRUD and attempts, plans/tasks, learning/review sessions, reports/recovery requests, resources, question banks, analytics/recommendations, subject catalogs, sync and system operations. They must not be represented as current school API guarantees solely from their controller files.

## Endpoint discovery and controller detail

The server-generated endpoint authority is OpenAPI: `GET /api/v2/openapi.json` (interactive: `/api/v2/docs`). It is the complete request-method/path list for the running composition and includes schema/decorator metadata. Use it rather than this audit when building a client, testing every endpoint, or generating SDKs.

For source review, controller files are located in `apps/api/src/modules/*/*controller.ts`. `apps/api/src/app.module.ts` is the deployment-time inclusion authority; controllers under source-only modules may be intentionally dormant.

## Mounted school-product modules

`apps/api/src/app.module.ts` is the authoritative runtime composition root. The mounted product modules are:

1. **Onboarding, Students and Registration** — account bootstrap, student creation/administration and registration completion.
2. **School education** — education catalog, classes and class groups in one composition bundle.
3. **Attendance, Workflows and Dormitory** — presence, leave/exit/letter requests, physical movement and room operations.
4. **Relationships, Guardian and School home** — family links and role-scoped household/school views.
5. **Student transfer and Import/export** — validated preview/commit transfers and scoped export paths.
6. **Dashboard, Schedule and Chat** — operational summaries, timetable APIs and conversations.

The repository contains additional legacy or candidate modules (for example exams, plans, learning, reports, sync and resources). Their presence under `apps/api/src/modules` is **not proof that they are mounted** in the current school API; the composition root intentionally leaves many of them dormant. Notifications are reachable through mounted workflow/chat dependencies.

## Admin application inventory

| Admin route / feature                              | Required capability or role        | What staff can do                                                                                                                          |
| -------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `/admin` dashboard                                 | authenticated supported Admin role | Role-specific dashboard and operational summary.                                                                                           |
| `/admin/students`                                  | `students.read`                    | Browse and manage student records according to granted actions.                                                                            |
| `/admin/registration`                              | `registration.read`                | Review registration workspace.                                                                                                             |
| `/admin/schedule`                                  | `schedule.read`                    | Role-scoped timetable; authorized staff can create, edit, archive, delete and transfer schedules.                                          |
| `/admin/classes`                                   | `classes.read`                     | Manage class details, roster, books, responsible teachers and advisor according to API capabilities.                                       |
| `/admin/books`                                     | catalog/class capabilities         | Class-first bookshelf: select a class, choose its academic year, add/import/export class-shelf books, and assign teachers when authorized. |
| `/admin/class-groups`                              | `class_groups.read`                | Manage learning/student groups.                                                                                                            |
| `/admin/attendance`                                | `attendance.read`                  | Attendance operations; `/admin/my-attendance` uses `attendance.self.read`.                                                                 |
| `/admin/family`                                    | `guardian.students.read`           | Guardian-scoped student/family surface.                                                                                                    |
| `/admin/leave-requests`                            | `leave.read`                       | Review and manage leave requests within server-approved scope.                                                                             |
| `/admin/exit-permissions`                          | `exit.read`                        | Review exit/return workflow and gate movement operations.                                                                                  |
| `/admin/dormitory`                                 | `dormitory.read`                   | Room and occupancy operations.                                                                                                             |
| `/admin/users`, `/admin/organizations`             | `users.read`, `organization.read`  | User, membership, role and organization administration.                                                                                    |
| `/admin/system`                                    | `system.manage`                    | System operations workspace.                                                                                                               |
| `/admin/settings`, `/admin/profile`, `/admin/more` | authenticated role                 | Account, notification and mobile-oriented utilities.                                                                                       |
| Student/teacher portal routes                      | role-specific                      | Student registration/leave views and teacher profile/chat entrypoints.                                                                     |

## Student-request alert flow

For student leave and exit requests, the workflow service creates high-priority `student_request` notifications for the responsible principal/supervisor scope. Online Principal and School Supervisor Admin sessions receive a shared full-screen modal with a direct link to the relevant review page. The modal is an alert/navigation aid; CRUD authority remains at the linked API and page capabilities.

## Known limits and audit boundaries

- This is a static source audit. It does not prove migration application, seeded roles, live provider configuration, authenticated browser behavior, or deployment health.
- `apps/student/` is absent from this checkout, so student-app runtime coverage cannot be audited here.
- Graphify output was used to locate source, but its graph can become stale; composition and routes were verified in source.
- Existing modules outside `AppModule` should be treated as dormant until explicitly mounted and tested.

## Verification commands

```bash
npm run workspace:check
cd apps/api && npm run build && npm test
cd apps/admin && npm run typecheck && npm test && npm run test:a11y && npm run build
```

Run only with each leaf package's existing install state. Do not run a root `npm install` as a replacement for the leaf lockfiles.
