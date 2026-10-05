# Moshaver Education Platform control-surface audit

Status: source audit on 2026-09-30. This document uses the product name **Moshaver Education Platform** for the combined Admin and Student experience. It is source-level evidence only; it does not prove a deployed API, browser behavior, device sync, or production authorization data.

## Scope and method

The audit compares the Admin app routes and API consumers in `apps/admin`, Student routes and API consumers in `apps/student`, and the canonical Nest controllers/services in `apps/api`. It treats a capability as complete only when the API has a server-authorized route and the relevant application exposes a usable workflow. User-owned settings are not automatically Admin controls.

## Verified learner surface

| Learner capability | Student surface | Server contract | Admin control status |
| --- | --- | --- | --- |
| Account education profile and textbook list | `/more/profile`, `/more/books` | `GET /students/me`, `GET /education-catalog/my-books` | Admin can create and update `gradeId`, `educationTypeId`, and `trackId` through `/students`; selection is server-validated. |
| Daily plan, tasks, focus session, completion and task support | `/plan` | `/student/dashboard`, `/student/plans`, `/student/tasks/*`, `/student/study-sessions/*` | Planner, task management, live activity, and task-issue follow-up are present. |
| Exams, results and retry requests | `/exam` | `/student/exams/*`, `/exams/*`, `/exam-attempt-requests` | Exam, assignment, question, syllabus and retry workflows are present. |
| Short quizzes | `/quizzes` | `/student/quizzes`, `/quizzes/*` | Quiz and question workflows are present. |
| Learning, review, resources and mistakes | `/learning`, `/resources`, `/more/mistakes` | `/learning/items`, `/learning-resources/assigned`, `/student/mistakes` | Admin has student learning CRUD, resource assignment, and mistake/recommendation views. |
| Reports, recovery and recommendations | `/more/reports`, `/more/insights` | `/reports`, `/recovery-requests`, `/student/recommendations` | Reports, recovery review, advisor inbox and recommendation workflows are present. |
| Communication and notifications | `/chat`, `/notifications` | `/chat/*`, `/notifications`, `/events` | Admin conversation, group and notification operations are present. |
| Family access | Guardian mode and `/more/family` | `/guardian/students/*`, relationships and guardian-selection routes | Admin has relationship and guardian workspaces; Student/Guardian access is server-scoped. |

## Gaps that block full Admin control

### 1. Education catalog controls — implemented

As of 2026-09-30, Admin can create, edit, publish, and archive textbook records from the Education workspace. Catalog records have a version, publication state, timestamp, and server-side audit event; the Student book projection now returns only published records. The default Iranian taxonomy remains source-seeded.

Organization-scoped catalog records now layer over the global default in the server-side Student projection. For the same school year, grade, textbook identity, and track, the visible organization record deterministically replaces the global default. Import preview validates row identity, grades, duplicates, and organization scope without mutation; commit creates drafts only, leaving publication as a separate authorized action.

Implemented product/API slice: explicit organization and school-year scope, migration-safe defaults, JSON file/paste import preview, and an authorized affected-student preview before publication.

### 2. Education operations overview — implemented

As of 2026-09-30, `EducationOverviewPage` also uses a server-scoped operations projection for profile completeness, grade/type/track distribution, published/draft/archived catalog counts, and learners without a published textbook mapping.

The projection now includes published-plan coverage, resource-assignment coverage, exam participation, and report participation for the authorized student population. It also exposes aggregate submitted-exam percentage and report-study-hour trends, plus bounded, server-scoped remediation queues for incomplete profiles and learners without plans, resources, exam attempts, or reports. Each remediation item links Admin to the existing student record rather than exposing data outside the caller's authorized scope.

The outcome trends support an optional server-validated date range, server-scoped grade cohort, and CSV export of authorized aggregate metrics.

### 3. Student sync support — implemented

The Student sync worker now reports device-scoped operational metadata (state, pending count, normalized failure code, and timestamps). Admin can read the aggregate pending count and failure condition in a student's activity workspace through existing server-side student-scope authorization. Authorized support roles can explicitly record a review; the server enforces `student.sync.support` and writes an audit event containing operational state only. Payload contents and learner data are never reported as health telemetry.

Sync-health entries are retained for 90 days by default (configurable from 7 to 365 days through `SYNC_HEALTH_RETENTION_DAYS`) and cleaned at API startup. Failure telemetry is normalized to a fixed operational taxonomy; arbitrary device error text is discarded. Student-generated correlation IDs are validated, stored with the operational report, and included in the privileged support-review audit event.

Support remediation workflow:

| Failure category | Authorized support action |
| --- | --- |
| `NETWORK_UNAVAILABLE` | Confirm the learner has network access, then ask them to use the in-app retry control. |
| `AUTHORIZATION` | Check account lifecycle and organization membership; do not alter the learner's local queue. |
| `CONFLICT` | Record the review, inspect the affected student record, and escalate to product support with the correlation ID. |
| `VALIDATION` | Correct the server-authoritative education/profile data if applicable, then ask the learner to retry. |
| `SYNC_WORKER_FAILED` or `UNKNOWN` | Record the review and escalate using the correlation ID; do not request payload contents from the learner. |

### 4. Relaxation/audio targeting — implemented

Admin-managed tracks now support an authorized organization picker, eligible grades, availability dates, and a server-calculated audience preview. The Student list and manual selection apply those rules server-side, and Admin changes are audited.

Impact: content is system-managed rather than an education-program control.

## Assessment control update — implemented

The assessment controls were extended after this audit with a safe, reusable Question Bank and a complete quiz delivery policy.

| Control | Admin/API behavior | Student behavior |
| --- | --- | --- |
| Reusable Question Bank | Create, edit, search, and archive independent source questions. Copying to an exam or quiz creates a historical snapshot with source provenance. | No direct source-bank access. Learners only receive the copied assessment question. |
| Balanced exam generation | Authorized users can ask the API for a non-mutating preview filtered by metadata and requested easy/medium/hard counts, then explicitly commit the preview. Existing source items already in the target exam are skipped. | No learner access. |
| Quiz audience | An authorized manager can replace direct learner and active-class allocations, or save grade/type/track audience rules. Once any target exists, organization membership alone no longer grants access. | `GET /student/quizzes`, quiz detail, and start all enforce the same server-side allocation rule. |
| Delivery window and attempts | A quiz has an optional open/close window and a positive attempt limit. Invalid windows are rejected. | Closed, not-yet-open, or exhausted quizzes cannot be started, even through a direct API call. |
| Result release | Immediate results remain available by default. A manual-policy quiz withholds scores and answer review until an authorized manager releases them. | Submission/history returns only a pending-result state until release. |
| Quiz analysis | Authorized Admin users can inspect submitted-attempt count, average score, grade cohorts, and per-question response distribution/accuracy. | No analytics endpoint is exposed to learners. |

Quiz allocation supports direct learners, active class rosters, and persisted profile rules. Multiple values within a profile field are alternatives; selected profile fields combine as an intersection.

## Student API findings

No broad missing API category was found for the implemented Student routes. Quiz delivery now has server-authoritative learner/class/profile assignment, schedule, attempt, result-release, and Admin analysis controls.

Two boundary rules are essential:

- Keep `GET /education-catalog/my-books` account-derived. The Student client must not select arbitrary grade, education type, or track parameters for personalized books.
- Do not turn user-owned preferences (theme, sessions, chat profile, notification preferences, guardian consent) into blanket Admin write controls. Any support override needs a distinct capability, user-visible policy, audit event, and narrowly scoped server endpoint.

## Delivery order

1. Add the education operations projection and Admin dashboard (read-only) so coverage gaps are measurable.
2. Add catalog versioning and controlled Admin authoring, then connect the dashboard drill-downs.
3. Add sync-health support visibility with strict privacy and audit controls.
4. Add relaxation-content targeting only if it is part of the academic program.

For every slice, update `packages/api-contract` if the response crosses application boundaries; add API authorization tests, Admin loading/empty/error states, Student scoped-contract tests, and browser/device evidence before calling it released.
