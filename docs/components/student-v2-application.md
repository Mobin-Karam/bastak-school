# Moshaver Student v2 application

Last reviewed: 2026-09-28

`apps/student/` is the active React/Vite Student application. It runs on the
web and is packaged by Tauri; runtime-neutral business rules remain in
`student-core/`. This page is the current source-backed companion to the
historical v1 parity material in `docs/migrations/`.

## Confirmed routes and access gates

| Route | Surface | Access gate |
| --- | --- | --- |
| `/` | Today/Home | dashboard read |
| `/plan` | schedule, task support and focus flows | plans read |
| `/exam` and `/quizzes` | exam and quiz experience | exams/quizzes read |
| `/chat` | conversations | chat access |
| `/learning`, `/resources` | learning items and assigned resources | respective read capability |
| `/notifications` | notification inbox | authenticated Student shell |
| `/more/:section?` | account, guardian, insights, reports, push and settings | section-specific access |

The router redirects unavailable capability surfaces instead of relying on a
hidden navigation item. The API remains the authority for every protected
resource and mutation.

## Implemented, tested feature areas

- authentication and role-aware portal access;
- task support, session/focus state and queued mutation transport;
- explicit offline, syncing and failed-sync feedback: queued changes remain local,
  the pending count is shown in Persian, and an online retry is available after
  a failed sync;
- exam preparation, attempts and timing helpers;
- chat, notifications, learning items, resources, sharing and relaxation audio;
- quizzes, reports, guardian insights, mistake notebook, password change and
  Push preference surfaces;
- route scroll restoration, web update handling, RTL/mobile shell and targeted
  accessibility coverage.

Evidence is in feature, API-client, sync, PWA and accessibility tests under
`apps/student/src/`. This proves source behavior only. It does not prove Push
delivery, a signed native artifact, Android device behavior, browser session
cookies on a deployed origin, or offline reconciliation against a live server.

## Reliability UX contract

- Today keeps one primary next action ahead of supporting progress, exam and
  notification information.
- A focus session is restored from the active server session when available and
  falls back to its durable local record if the server cannot be reached.
- Offline wording never claims a change reached the server: it distinguishes
  saved-on-device, syncing, needs-attention and retryable states in Persian.
- Automatic update behavior must remain non-disruptive while focus timing or a
  quiz is active; target-device and live-reconnect acceptance remain required.

## Validation

```bash
cd apps/student
npm run typecheck
npm test
npm run test:a11y
npm run build
```

For native acceptance, run the relevant `tauri:build` or `android:build` gate
and then test the produced artifact on its target device. See the
[Student runtime boundary](../architecture/student-v2-tauri-runtime.md) and
[repository runbook](../operations/repository-runbook.md).
