# Bastak School Admin mobile UI/UX audit

**Date:** 2026-10-18  
**Scope:** `apps/admin/src`, `packages/admin-workspace-ui`, and the Admin route, shell, shared-UI, theme, and feature sources. This is an audit and roadmap, not an implementation or API change.

## Evidence and limits

- The application is React 19/Vite/TypeScript/Tailwind. Its existing packages already include React Query, React Hook Form + Zod, Radix Dialog, Base UI, TanStack Table, Lucide, and Vitest/axe/Playwright; the plan does not require a new dependency (`apps/admin/package.json`).
- `router.tsx` registers `/login`, `/register`, and 21 Admin child routes, all under `ProtectedRoute` and `AdminLayout`; capability-sensitive routes use `CapabilityRoute` (`apps/admin/src/app/routing/router.tsx`).
- The current checkout has unrelated, uncommitted layout-file moves. Findings cite the live destination paths when available. No layout refactor should be folded into the mobile programme until that move is separately stabilized.
- This was source and test-inventory review only. No device/browser/screen-reader session was run, so visual and interaction conclusions marked **verify** need the device matrix in the companion plan.

## Current system map

```text
router -> ProtectedRoute -> AdminLayout -> AdminShellChrome
                                      -> phone: MobileShell + bottom navigation
                                      -> tablet: compact rail + header
                                      -> desktop: main/context rails + header
                                      -> SharedPageViewport -> capability-gated route screen
                                                                    -> feature page
                                                                    -> shared UI / API / React Query

Shared UI: ui.tsx, data-table, modal, responsive-drawer, locale, theme
Portable non-React logic: @moshaver/admin-workspace-ui (preferences/search only)
```

The shell selects phone/tablet/desktop presentation through `useViewportShell`; the concrete desktop threshold is 1200px and the tablet shell is documented as 768–1199px. It keeps a dynamic visual-viewport CSS height and safe-area handling in `AdminLayout`, `MobileShell`, `SharedPageViewport`, and `styles/globals.css`.

## Route and feature inventory

| Surface | Current route or ownership | Mobile assessment |
| --- | --- | --- |
| Entry/authentication | `/login`, `/register`; `features/auth` | Separate responsive login/signup components; test narrow keyboard, error and OTP/password states. |
| Role home | `/admin`; `features/dashboard`, `school-home` | Role-specific dashboards and mobile dashboard pieces exist; prevent widget density from producing long, low-priority feeds. |
| People and access | `students`, `users`, `organizations`, `family`, `profile`; `students`, `access`, `guardian`, `student-portal` | High-density master/detail, tables and profile forms; first priority for card/detail patterns. |
| Education operations | `classes`, `books`, `class-groups`, `schedule`, `attendance`, `my-attendance`; `education`, `schedule`, `attendance`, `teacher-portal` | Timetables, rosters, shelf visuals and attendance controls need explicit phone interaction audits. |
| Requests and residence | `leave-requests`, `exit-permissions`, `dormitory`, `student-leave` | Operational queues should use summary cards, safe bottom actions, and progressive detail. |
| Communication | `sms`; plus `chat`, `notifications`, `followup`, `attention` feature sources | SMS already has a staged flow; chat/notification flows need keyboard, long-list and bottom-nav overlap checks. |
| Planning/assessment | `planner`, `plan-templates`, `learning`, `exams`, `quizzes`, `questions`, `reports`, `subjects` feature sources | Some feature sources are not exposed by the current router; retain them in the inventory but do not schedule UI work until route/product ownership is confirmed. |
| System/account | `settings`, `system`; `settings`, `system`, `pwa` | Account settings are suitable for mobile; system administration is intentionally warned as desktop-oriented for platform administrators. |
| Registration | `registration` currently renders `RegistrationComingSoonPage`; full registration feature sources exist | Treat full registration as a separate product activation, not a silent responsive migration. |

## Shared component inventory

| Area | Evidence | Assessment |
| --- | --- | --- |
| Core primitives | `shared/ui/ui.tsx`: Button, Card, Input, Textarea, Checkbox/CheckboxGroup, Select, Badge, EmptyState, LoadingState, ErrorState, Field, PasswordInput | Strong baseline: buttons have 44px primary target height, loading/disabled states and focus rings. The large single primitive file is a maintainability hotspot, but splitting it is not a mobile prerequisite. |
| Collections | `shared/ui/data-table/*`, `admin-data-table.tsx`, `admin-list.tsx`, `collection-toolbar.tsx` | Best current migration target: one headless table model renders desktop table and mobile cards, plus selection, details drawer, filtering, pagination, offline/busy state and export. Legacy list/table call sites still coexist. |
| Overlays | `modal.tsx`, `dialog.tsx`, `responsive-modal.tsx`, `responsive-drawer.tsx`, `mobile-sheet.tsx` | `ResponsiveDrawer` is a sound shared contract: Radix dialog, RTL direction, 88dvh max phone sheet, safe-area padding, sticky title, 44px close control, side drawer at `md`. Several overlay APIs remain, creating selection ambiguity. |
| Navigation/context | `layout/navigation/*`, `AdminHeader`, `AdminAccountMenu`, `work-context-bar`, command palette | Capability-derived navigation is centralized. Phone nav deliberately exposes a reduced surface plus `/admin/more`; validate that every authorized destination remains discoverable. |
| Localization/theme | `shared/ui/locale.tsx`, `shared/theme/theme.tsx`, `styles/globals.css` | Persian/English direction, dark theme, role accents, motion reduction and safe-area rules exist. Feature-local physical left/right classes still require an automated RTL scan and visual verification. |
| Portable package | `packages/admin-workspace-ui` | Correctly framework/domain neutral: collection/card preferences, dashboard layout and command search only. It must remain free of roles, permissions, routes, API and renderers. |

## Roles and authorization

Navigation uses capability filtering and `CapabilityRoute`; `/me/context` remains the authority for role, organization and capabilities. The live role-title map covers principal, disciplinarian, counselor, religious/government education managers, mentor, teacher, student, guardian, organization/school/platform administrators, and supervisor (`admin-navigation.ts`). The shell has a platform-admin small-screen warning, but warning text is not a substitute for a usable, capability-safe flow.

## Findings and priorities

| Priority | Finding | Evidence / risk | Required outcome |
| --- | --- | --- | --- |
| P0 | Current shell move is incomplete in the working tree | Old/new layout paths and an untracked compatibility folder coexist | Land or revert that focused refactor separately; all mobile work must import one canonical public layout entry. |
| P0 | Mobile visual quality is unproven | Automated source checks cannot prove RTL, keyboard, browser chrome or touch behavior | Establish device/browser/role acceptance matrix before changing page visuals. |
| P1 | Multiple collection patterns remain | Shared DataTable with cards exists alongside `AdminDataTable`, `AdminList`, feature-local tables and dense workspaces | Adopt the shared responsive collection contract feature by feature; do not convert specialist timetable/roster grids blindly. |
| P1 | Overlay choices are fragmented | Modal, dialog, responsive modal, drawer, mobile sheet and feature-local usage coexist | Publish overlay decision rules; use ResponsiveDrawer for operational create/detail/edit flows that are sheets on phone. |
| P1 | Long operational pages risk nested/competing scroll | Shell owns viewport scrolling, while complex feature panes and sheets manage local scrolling | Establish a scroll-ownership contract and test keyboard/URL-anchor/restoration behavior. |
| P1 | Desktop-first platform/system workflows are not phone-optimized | Mobile shell explicitly warns platform administrators | Keep them functional and authorized; provide summary/read-only phone access where a full data grid is unsafe, with a clear desktop continuation. |
| P2 | Breakpoints are not a single documented product contract | Tailwind utilities mix with CSS at 600, 639, 1023, 1200 and 1280px | Document semantic phone/tablet/desktop behavior, then consolidate only when proven safe. |
| P2 | Feature state quality varies by page | Shared states are available, but source inventory shows many page-local query/form implementations | Require loading, empty, error/retry, offline, disabled, permissions and mutation-feedback states in each migrated feature. |
| P2 | Form implementation is uneven | RHF/Zod are installed; many feature forms are bespoke | Standardize semantics and error summary/field linkage first; do not force a form-library rewrite. |
| P2 | Performance budgets are implicit | Shell disables decorative motion/backdrop effects when reduced; dashboards/timelines/grids remain potentially heavy | Measure actual phone performance and virtualize/paginate only after profiling. |

## Accessibility and RTL assessment

Strengths: focus-visible styling, semantic `Field` relations, aria busy/error/empty primitives, dialog focus management, Escape/close affordances, motion-reduction selectors, Persian-aware locale utilities, logical margin use in the shell, and safe-area padding are present.

Open verification items: all touch targets in feature-local controls; focus restoration after every overlay; screen-reader names for icon-only actions; table-card semantic parity; logical ordering of mixed Persian/numeric data; 200% text and 320 CSS-pixel reflow; Android keyboard/visual viewport; iOS bottom inset; dark theme contrast; reduced-motion behaviour; and horizontal-only overflow for specialist grids.

## Migration checklist by feature family

- [ ] Shell/navigation: stabilize layout move; exercise bottom nav, More, drawer, command palette, role and organization switching at phone/tablet/desktop.
- [ ] Dashboard/school-home: prioritize actionable work, cap initial widgets, preserve calendar state across shell changes, test reduced performance mode.
- [ ] Students/access/guardian: migrate eligible lists to DataTable cards; make detail/edit actions drawers; preserve capability and student-context logic.
- [ ] Classes/books/groups/subjects: audit dense editors and shelf scene at 320–430px, keyboard and RTL; retain specialist visual layouts only when they remain useful.
- [ ] Attendance/schedule/leave/exit/dormitory: use a phone summary -> filter -> detail path; test roster/timetable overflow, bulk actions and safe destructive confirmations.
- [ ] SMS/chat/notifications/follow-up/attention: prevent composer/toast/bottom-nav collision; test long Persian messages, unread state and offline/retry.
- [ ] Planner/learning/exams/quizzes/questions/reports: confirm active product route first; then use compact filters, progressive disclosure and accessible drag alternatives.
- [ ] Registration/onboarding/auth: distinguish live versus coming-soon routes; test full validation, upload, recovery and error paths before activation.
- [ ] Settings/system/PWA: use grouped settings cards; retain desktop escalation for disruptive/system actions; test PWA update, offline and session-management states.

## First safe implementation task

**Stabilize and test the in-progress Admin layout public-entry migration only.** Complete the existing `app/layout` move so `router.tsx` and all consumers use one exported shell/navigation entry, remove no compatibility path until imports are migrated, and run the focused shell/navigation tests plus `npm run typecheck`. This changes neither API nor feature UI; it removes the immediate architectural ambiguity that would otherwise make every mobile migration conflict-prone.

