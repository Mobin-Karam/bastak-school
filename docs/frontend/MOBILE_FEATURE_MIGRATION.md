# Mobile feature migration tracker

**Rule:** a feature is complete only after its focused tests, Admin type/lint/build gates, and browser/device evidence are recorded. Shared components may change presentation only; routes, capabilities, API payloads, organization scope and business rules remain authoritative outside mobile views.

## Group 1 — Attendance, Students, Timetable

| Feature | Current evidence | Mobile-system migration | Status | Verification / remaining work |
| --- | --- | --- | --- |
| Attendance and history | `AttendancePage`, `AttendanceRosterView`, review/session workspaces; roster has search, status filters, absence-first handling, write preparation and conflict protection. | Retained its established responsive roster and sticky review/submit workflow; it already satisfies the phone-specific interaction contract more safely than a wholesale component swap. | Source and focused-test verified | Real touch/keyboard verification of search, absent selection, review, history and duplicate-submit behavior remains. |
| Students and profiles | `StudentsPage` uses `ManagementMasterDetail`; `StudentList` uses `AdminDataTable`; `StudentDetail` owns detail tabs. | Retained the existing mobile directory/detail state, filtering, pagination and capability-gated edit/create actions. | Source and focused-test verified | Exercise 320–430px profile sections, editor validation, selection/back flow and transfer actions. Do not replace its bounded desktop scroll model without visual proof. |
| Timetable / schedule | `LegacySchedulePage` is the live schedule route; it already renders day-first lesson cards on a phone and a matrix on larger screens. | Replaced the phone weekday chooser with shared `MobileTabs`, retaining existing day state, lesson details, edit/archive/delete guards and timetable APIs. | Migrated at source/build boundary | Add direct LegacySchedulePage behavior coverage; verify day switching, lesson cards, dialogs and keyboard focus on phone. `TimetablePage` remains gated and is not activated by this migration. |

## Group 2 — Dashboard, dormitory, and education operations

| Feature | Current evidence | Mobile-system migration | Status | Verification / remaining work |
| --- | --- | --- | --- | --- |
| Dashboard / school home | `RoleDashboard` selects `MobileDashboardHome` using the same role payload and capability list as larger workspaces. The view provides calendar, current/next class, prayer, announcements and at most six capability-safe shortcuts. | Replaced mobile-only announcement and class surface wrappers with shared `MobileCard`; payload, quick-action filtering and route links are unchanged. | Migrated at source boundary | Verify real 320–430px and landscape navigation, calendar interaction, dark theme and screen-reader reading order. |
| Dormitory management | `DormitoryPage` owns capability-gated rooms, assignments, capacity protection, targeted announcements and existing responsive drawers. | Replaced the resident-filter control with shared `SearchBar`; existing assignment state, capacity limits, save/retry and drawer workflows remain unchanged. | Migrated at source boundary | Verify virtual-keyboard scrolling, resident selection, save failure/retry and announcement flow on a phone. |
| Classes, class groups, subjects and books | `ClassesPage`, `ClassGroupsPage`, education pages and `BookShelfPage` have distinct class/member, subject and table/card workflows. | `ClassGroupsPage` uses shared `SearchBar` for group/member filtering; `BookShelfPage` uses shared `MobileSelect` for its URL-backed class picker and responsive `DataTable` cards. Live `ClassesPage` class cards now have a 44px-plus target and visible keyboard focus; its Jalali-year chooser meets the 44px baseline. | Partially migrated at source/build boundary | Exercise class selection, editor, roster save/cancel, class-picker deep links, book create/edit/delete/remove confirmation. `EducationOverviewPage`/subjects source is not router-mounted and is intentionally not activated. |

## Remaining feature groups

| Group | Features                                                                                      | Status                                                              |
| ----- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| 2     | Dashboard/school home, classes, class groups, subjects, books, dormitory                      | In progress — dashboard and dormitory foundation migrated; education operations inventoried. |
| 3     | Exams, quizzes, questions, learning, reports, analytics                                       | Route audit complete — implemented source modules are not mounted by the current Admin router; do not activate under this migration. |
| 4     | Guardian, teacher portal, registration/onboarding, leave/exit, counseling/follow-up           | Partially migrated — guardian selector and progress metrics, leave/exit controls, and teacher profile surface migrated; registration is intentionally coming soon and no counseling route exists. |
| 5     | SMS, chat, notifications, settings/security/access, system/PWA, gamification if source exists | Partially migrated — live SMS/settings/system reviewed; mobile role switcher and notification tabs use shared mobile controls. Chat, notifications page, and gamification have no Admin route mount. |

## Validation record

- 2026-10-18 Group 3 route audit: the Admin router currently has no mounts for the implemented `exams`, `quizzes`, `questions`, `learning`, or `reports` source modules. They remain intentionally unactivated; their access contracts and mobile presentation therefore require a separately authorized routing/product decision. No analytics Admin route was found.
- 2026-10-18 Group 4 guardian/leave/exit slice: guardian student selection now uses `MobileSelect`; leave and exit request filters use `SearchBar`. Guardian copy and exit-permission API suites passed (2 files, 4 tests); `npm run typecheck`, `npm run lint`, and `npm run build` passed.
- 2026-10-18 Group 4 live-route audit: `teacher-profile` is a live role-aware route and now uses `MobileCard`. `teacher-chat` and registration remain explicit coming-soon routes. No counseling/follow-up feature directory or Admin router mount exists, so no capability or workflow was invented.
- 2026-10-18 Group 4 guardian follow-up: the repeated guardian progress cards now use shared `StatisticCard`; student selection, relationship-scoped requests, timetable, attendance, exam and report query semantics remain unchanged.
- 2026-10-18 Group 5 route audit: SMS, settings and system are live Admin routes. SMS already uses the shared segmented control for staged compose/campaign/settings tasks; settings has a mobile account-actions surface; system exposes capability-gated operational tools. Notifications, chat and gamification source are not mounted as Admin routes. `MobileNotificationTabs` now has a minimum 44px touch target; its existing URL-backed notification filters and capability-derived advisor inbox are unchanged.
- 2026-10-18 Group 5 notification slice: notification page/panel suites passed (3 files, 5 tests); `npm run typecheck`, `npm run lint`, and `npm run build` passed.
- 2026-10-18 Group 5 settings follow-up: the mobile account role switcher now uses shared `MobileSelect`. The existing active-role update, capability-context refresh/error handling, theme switcher and sign-out confirmation remain unchanged. `Field`/`MobileSelect` labels accept React content to preserve the visible icon label and native label association.
- 2026-10-18 final source gate: `mobile.test.tsx` and `system-settings.test.tsx` passed (2 files, 8 tests); `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`, and `npm run test:a11y` passed (1 file, 6 tests). The complete `npm test` suite exceeded the available capture window without a completion result and is intentionally recorded as unverified.
- 2026-10-18 Group 2 dashboard/dormitory slice: `MobileDashboardHome.test.tsx` and `DormitoryPage.test.tsx` passed (2 files, 10 tests). `npm run typecheck`, `npm run lint`, and `npm run build` passed after the presentation-only changes.
- 2026-10-18 Group 2 education slice: `ClassGroupsPage.test.tsx` and `BookShelfPage.test.tsx` passed (2 files, 16 tests). `npm run typecheck`, `npm run lint`, and `npm run build` passed. The shared mobile barrel is not used by the affected test-isolated pages because it loads feedback exports that their notifications mock deliberately omits; direct `mobile/forms` imports keep the dependency surface narrow.
- 2026-10-18 Group 2 classes follow-up: the live class selection cards now expose a visible keyboard focus state and at least 44px touch height; the Jalali school-year controls also meet the 44px target baseline. Class/roster/book queries and mutations are unchanged. `EducationOverviewPage` and the subjects source remain unmounted by the current Admin router.
- 2026-10-18: After `apps/admin` leaf `npm ci`, the file-based `@moshaver/api-contract` installation correctly included the existing SMS exports. `npm run typecheck`, `npm run lint`, and `npm run build` passed.
- Production build warnings remain: a PostCSS plugin omits source metadata, and the spreadsheet chunk exceeds the configured size warning. Neither warning was introduced by this migration.
- Focused Group 1 suite: 25 tests passed (attendance page, student scroll/form, segmented/mobile-tab coverage). Browser, assistive-technology and target-device evidence is still outstanding.

## Shared acceptance criteria

- Capability-filtered route and action visibility remains server-aligned through `/me/context`.
- Phone views use one data/query/mutation implementation with tablet/desktop, not separate mobile APIs.
- Touch targets are at least 44 CSS pixels; RTL/LTR, dark theme, safe area, reduced motion and keyboard flows work.
- Every migrated async feature visibly handles loading, empty, error/retry, offline and disabled/busy states where applicable.
- The page viewport owns normal vertical scrolling; specialist grids document any bounded overflow.
