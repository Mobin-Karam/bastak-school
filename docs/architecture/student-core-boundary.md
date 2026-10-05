# Student Core Architecture

Last reviewed: 2026-09-28

## Purpose

`student-core/` is the runtime-neutral boundary used by the active
`apps/student/` web, Tauri desktop, and Tauri mobile shells. It contains
business logic that must not depend on DOM, React, service workers, browser
storage, or native APIs. The archived v1.4 Student implementation is historical
reference only and lives on the isolated `archive/v1.4` branch.

## Package Layout

- `auth/`: student-session restoration and student-role validation.
- `planner/`: planned minutes, task status, current/next task selection, plan metrics.
- `tasks/`: task completion payload logic.
- `exams/`: quiz attempt answer shaping, unanswered count, remaining time calculation.
- `questions/`: option normalization helpers.
- `reviews/`: review interval helpers.
- `chat/`: message append and unread-count helpers.
- `notifications/`: unread-count and immutable read-state helpers.
- `sync/`: sync queue item creation, push orchestration, conflict policy helpers.
- `storage/`: platform-neutral storage helpers plus in-memory test provider.
- `providers/`: interfaces implemented by browser, Tauri, and test adapters.

## Provider Interfaces

The core depends on interfaces only:

- `AuthProvider`
- `StorageProvider`
- `NotificationProvider`
- `SyncProvider`
- `NetworkProvider`
- `RealtimeProvider`
- `ClockProvider`

Browser and Tauri implementations must live outside core. Business modules should never import:

- `window`
- `document`
- `navigator`
- `localStorage`
- `sessionStorage`
- `EventSource`
- service worker APIs
- React components or hooks
- Tauri APIs

## Current logic covered

The package owns tested runtime-neutral behavior for:

- planner time math and status decisions
- active-session current task fallback
- task completion payload construction
- exam/quiz countdown bounded by exam close time
- quiz attempt payload generation
- offline sync conflict policy
- notification unread/read helpers
- chat message list helpers

## Adapter Strategy

Web adapter:

- wraps the active `/api/v2` HTTP contract through the Student application API layer
- owns browser cookie/CSRF transport behavior outside the core
- may use `localStorage`, `sessionStorage`, service worker, and `EventSource`

Tauri adapter:

- uses native HTTP or webview fetch depending on final security model
- stores durable local data in SQLite
- implements realtime with SSE-compatible transport or polling fallback
- exposes the same provider interfaces to the UI

## Migration Rule

Only logic characterized in tests belongs in the core. Application UI should call
`student-core` rather than reimplementing planner, exam, chat, notification,
auth, storage, or sync decisions inside components.
