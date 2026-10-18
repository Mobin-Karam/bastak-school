# Admin frontend architecture

Status: **current-state audit and incremental migration guide** (2026-10-18).

`apps/admin` is a React/Vite application. It is already substantially feature-first; this document records the boundaries that are present in source and the small, compatible migration path rather than prescribing a rewrite.

## Current dependency map

```text
main.tsx
  -> app/providers (theme, query cache, locale, modal, auth, notifications, PWA)
  -> app/routing (lazy route composition and capability routes)
  -> app/layout (responsive desktop/tablet/mobile shell and navigation)
  -> features/* (business UI, feature APIs, models, hooks, pages)
       -> shared/* (transport, domain-neutral UI, utilities, errors, theme)
       -> @moshaver/api-contract (HTTP DTO types)
       -> @moshaver/admin-workspace-ui (framework-neutral dashboard preferences)
```

Routes are composed in `apps/admin/src/app/routing/router.tsx`; authenticated routes are under `/admin`. `CapabilityRoute` is the client-side UX gate, while the API remains the authorization authority. The route table currently includes dashboard, students, registration, schedule, classes, books, class groups, attendance, student attendance, guardian, leave, exit permissions, dormitory, access, SMS, system, settings, and portal pages.

The source currently has 818 TypeScript/TSX files. Feature folders commonly contain `api`, `components`, `model`, `pages`, `hooks`, and tests, although their exact depth follows feature complexity. `shared` contains the Admin design primitives, transport client, general hooks, theme, and utilities. It must not import a product feature.

## Shared packages and contracts

- `packages/api-contract` is the typed, shared HTTP boundary. Admin features use it for attendance, timetable, academic structure, organization, notification, and SMS DTOs. It is a type/contract package, not a location for UI behavior.
- `packages/admin-workspace-ui` owns framework-neutral collection/dashboard normalization and browser preference persistence. `features/dashboard/model/dashboard-layout.ts` is its Admin adapter; it keeps actual widgets and capability decisions in the feature.

## Attendance migration: first increment

`features/attendance` owns two lazy routes, attendance transport adapters, its workflow/write models, staff and student workspaces, and focused tests. Route exports remain in `features/attendance/index.ts`; its lightweight cross-feature interface is `features/attendance/public.ts`, so shell/dashboard consumers do not eagerly load route pages.

Cross-feature consumers must import `attendance/public`, not `attendance/api`, `attendance/components`, or `attendance/model` internals:

- `app/layout` consumes `StudentAttendancePoolPrompt`.
- `dashboard` consumes the student attendance summary contract and encouragement query.
- `school-home` consumes the staff attendance overview query.
- `teacher-portal` consumes the class attendance workflow interface.

This increment does not move implementation or alter requests, permissions, caching keys, accessibility, RTL layout, or user-visible behavior. It replaces the existing deep cross-feature imports with an explicit interface, making later internal extraction safe.

## Target rules

1. `app` composes providers, routes, layouts, navigation, and feature public interfaces. It does not own feature workflows.
2. A feature may use `shared`, public package contracts, and another feature's public entrypoint. It must not deep-import another feature.
3. `shared` remains domain-neutral and never imports from `features`.
4. A feature exports only deliberate page, component, hook, model, and API interfaces from a documented public entrypoint; cross-feature callers do not reach implementation paths. Separate a lightweight public surface from a lazy route barrel when importing the latter would defeat code splitting.
5. Pages coordinate feature state and render feature components. Extract a cohesive section before splitting a large page; avoid speculative directories or generic state abstractions.
6. UI capability checks use `useAuth().can/canAny/canAll` and `CapabilityRoute`. They improve navigation and interaction UX only; server authorization and organization scope remain authoritative.
7. Keep `@moshaver/api-contract` DTOs typed at the transport boundary. Do not duplicate backend DTOs in UI components.
8. Preserve one responsive, mobile-first, Persian RTL workflow per feature. Do not fork a feature by viewport or role unless the workflow is actually distinct.

## Audit findings and priorities

| Priority | Finding                                                                                                                                                             | Evidence                                                                                          | Migration action                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| P0       | Admin-wide typecheck is failing outside attendance because SMS imports absent contract exports and has implicit `any` callbacks.                                    | `features/sms/api/sms.api.ts`, `features/sms/pages/SmsPage.tsx`                                   | Repair the SMS contract change separately; do not mask it in an attendance refactor.                           |
| P1       | Attendance has two oversized, mixed-responsibility surfaces.                                                                                                        | `pages/AttendancePage.tsx` (1,000 lines), `components/AttendanceStaffWorkspace.tsx` (1,289 lines) | After the public-boundary increment, extract cohesive roster/session/policy sections with their focused tests. |
| P1       | Four consumers reached attendance implementation paths.                                                                                                             | Admin shell, dashboard, school-home, and teacher portal imports                                   | Completed in this increment through the attendance public entrypoint.                                          |
| P2       | Other app composition code still has feature implementation imports.                                                                                                | command-palette search and the under-construction page in router                                  | Migrate each owning feature deliberately; do not broaden this attendance change.                               |
| P2       | The existing architecture checker protects project and backend boundaries, but does not yet enforce Admin feature-to-feature public entrypoints or frontend cycles. | `tooling/architecture/check-boundaries.mjs`                                                       | Add a scoped frontend-boundary/cycle check after a baseline audit; first inventory accepted exceptions.        |
| P3       | Feature index consistency varies.                                                                                                                                   | feature `index.ts` inventory                                                                      | Standardize only as a feature is touched, preserving intentionally private APIs.                               |

## Verification boundary

The attendance-focused Vitest suite is the baseline for this increment. Run Admin typecheck, lint, build, a11y, and Playwright separately; successful source checks do not prove rendered browser, device, provider, or production behavior.
