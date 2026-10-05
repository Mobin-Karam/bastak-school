# Student surface gap audit

Status: 2026-09-29. This is a source-level comparison of Student routes/store calls with the product modules currently exposed by the API. It is not production-runtime evidence.

## Available to Student and surfaced

- Daily plans, tasks, task completion, plan sharing, and linked exams.
- Timed exams, exam syllabus, attempts, retry requests, quizzes, learning reviews, resources, notifications, chat, reports, recovery requests, mistakes, profile, guardian selection, audio, and account/session settings.

## Intentionally not Student-facing

- Organization administration, staff/role management, imports/exports, audit history, system operations, onboarding administration, and advisor/teacher student management. These remain Admin/API operations.

## Product gaps requiring a separate model

- Reusable class timetable: class tasks can be imported and displayed, but there is no organization-level recurring timetable CRUD model.
- Official exam-event calendar: imported runnable exams work; external calendar events are not yet a distinct Student calendar feed.
- Track-selection and planning-rule profiles: account education type/track filters are available for Admin student targeting, but advisor-authored reusable planning-rule profiles are not persisted as a product entity.

## Verification rule

Before promoting one of these gaps, add its API authorization contract, Student route/loading/empty/error states, and an API plus Student regression test. Do not expose organization-wide records to a student client without server-side student scoping.
