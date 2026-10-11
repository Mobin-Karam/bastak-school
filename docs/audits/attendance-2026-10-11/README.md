# Attendance audit — 11 October 2026

Implementation has since started; see the [implementation ledger](../../implementation/attendance-modernization.md) for fixes and current limitations. The findings below describe the original audit baseline.

This audit covers the principal and school supervisor workspaces, teacher schedule/attendance drawer, student self-attendance page in Admin, and their API implementation. It also documents the desktop header/profile fixes made with this review.

**Evidence limits:** findings below are based on source inspection and local browser rendering. Screenshots show the actual React components with synthetic names, phone numbers, classes, and API responses. They demonstrate UI states, not a successful production integration or a security penetration test. Runtime role grants, production migrations, delivery of live events, and actual data quality are **UNKNOWN**. `apps/student/` is missing in this checkout; its separate application cannot be audited or photographed. The student screenshot is the existing Admin self-attendance page, not that missing app. Graphify's graph and executable are unavailable.

[Open the screenshot gallery](gallery.html). Individual images are linked below.

## What each role has

| Surface              | Available behavior                                                                                                                                                                                                  | Authority and scope                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Principal            | Class, class-group, and dorm attendance; date selection; roster search/filter; four statuses; mark remaining students present; partial saves; recent sessions; live absence-review queue; approve/reject reasons    | Navigation/route requires `attendance.read`; write API requires `attendance.manage`; review API requires `attendance.review` plus the service's allowed-role check. Access is intended to remain within authorized organizations.                                                                                                                                         |
| School supervisor    | Same shared attendance workspace and review queue as principal, with the active organization/role shown in the header                                                                                               | Supervisor attendance grants appear in `1728600000000-SupervisorSchoolOperations.ts`; review grants appear in `1729900000000-AttendanceAbsenceReview.ts`. Actual `/me/context` is the runtime authority.                                                                                                                                                                  |
| Teacher              | Open a scheduled class from the weekly timetable or dashboard; view participants; choose present/absent/late/excused; add up to 500 characters of absence reason; save selected marks; see recent manager decisions | Editing the drawer requires `auth.can("attendance.manage")`. The API checks teacher assignment through classroom advisor or class-book teacher. Dorm access is denied to non-school-wide roles. Later migration `1728300000000-SchoolWorkflowCapabilityGrants.ts` adds generic attendance management to teachers; granular grants alone are insufficient for this UI/API. |
| Student in Admin     | Four summary counters and latest attendance statuses with dates and optional notes; loading, empty, and retry states                                                                                                | `/admin/my-attendance` requires `attendance.self.read`. API resolves the student from the signed-in user, rather than accepting a student ID from the client. Records endpoint returns up to 60 rows; summary counts all stored rows.                                                                                                                                     |
| Separate student app | **UNKNOWN**                                                                                                                                                                                                         | `apps/student/` is absent. No attendance feature was located in the runtime-neutral `student-core` sources.                                                                                                                                                                                                                                                               |

Primary sources: [navigation](../../../apps/admin/src/app/layout/navigation/admin-navigation.ts), [route guards](../../../apps/admin/src/app/routing/router.tsx), [controller](../../../apps/api/src/modules/attendance/attendance.controller.ts), [service](../../../apps/api/src/modules/attendance/attendance.service.ts), [teacher sheet](../../../apps/admin/src/features/teacher-portal/components/TeacherClassAttendanceSheet.tsx), [student page](../../../apps/admin/src/features/attendance/pages/MyAttendancePage.tsx).

## How attendance works

1. Principal/supervisor selects class, class group, or dorm, then a specific context and date. Dorm selection groups rooms by building and floor. Teacher opens a scheduled class; teacher submission uses the current timestamp rather than the scheduled date.
2. Participants start **unmarked**. A person can be marked present, absent, late, or excused. The main page shows progress/counts and lets the user search or filter. “Mark unmarked present” preserves deliberate absences and late marks.
3. Only marked students are sent to `POST /api/v2/attendance/bulk-mark`. The main page asks before a partial save. The teacher drawer allows partial saves without this confirmation. Neither current frontend sends a `sessionId`; the service therefore creates a new session for each submission.
4. The API checks the capability, organization access, context assignment, and participant membership. Records are unique within a `(session, student)` pair. An absence is assigned `reviewStatus=pending`, even if no reason was supplied. Any later write clears the previous review decision.
5. The service emits `attendance.updated` to active organization members. The main page refreshes history and flags a conflict if a local draft exists. This is a UI warning, not server-enforced version locking.
6. Principal/supervisor reviews the pending absence reason. Approval changes status to **excused**; rejection leaves it **absent**. Reviewer, timestamp, and optional review note are persisted. The current review UI sends only the decision, without a note input.
7. `attendance.reviewed` is emitted to the original recorder and reviewer. Teacher drawer invalidates its review query and displays the result. Other reviewers and the student self-page do not receive an equivalent guaranteed refresh through these components.
8. Students view their own saved records and summary. The current list displays date/status/note, but not a resolved class/group/room name.

Sources: [main workflow](../../../apps/admin/src/features/attendance/pages/AttendancePage.tsx), [roster](../../../apps/admin/src/features/attendance/views/AttendanceRosterView.tsx), [API adapter](../../../apps/admin/src/features/attendance/api/attendance.api.ts), [review queue](../../../apps/admin/src/features/attendance/components/AttendanceReviewQueue.tsx), [DTOs](../../../apps/api/src/modules/attendance/attendance.dto.ts), [record entity](../../../apps/api/src/database/entities/attendance-record.entity.ts).

## Findings and practical fixes

Attendance behavior was audited, not changed in this task. These findings remain open.

### A1 — Critical: context ownership can be bypassed on school-wide writes

`createSession` and `bulkMark` authorize the submitted organization, then call `assertContextAccess`. That helper returns immediately for school-wide roles without resolving whether the submitted class/group/room belongs to that organization. `participantIds` subsequently queries by context ID without an organization condition. This creates a source-confirmed path for a school-wide user to associate a foreign context and its students with an authorized organization's session if those IDs are known. Read-participant access does resolve and authorize the context's real organization; the write path must do the same.

**Fix:** resolve context ownership for every write, require its organization to match the authorized session organization, and then apply role/assignment checks. Add cross-organization principal/supervisor regression tests. No exploit was run against production.

Evidence: [service `createSession`, `bulkMark`, `participantIds`, and `assertContextAccess`](../../../apps/api/src/modules/attendance/attendance.service.ts).

### A2 — High: partial writes and duplicate submissions

A new session is saved before participant validation; invalid input can leave an empty session. Records are then written sequentially without a transaction. A failure midway can persist some marks while the UI reports failure; retry creates another session. There is no request idempotency key, unique context/date occurrence constraint, duplicate-entry check, or DTO batch maximum. `(session, student)` uniqueness does not prevent a retry from creating duplicate sessions.

**Fix:** validate the complete bounded batch before persistence, use one transaction, reject duplicate student IDs, and introduce a deliberate session identity/idempotency policy. Tests should cover invalid members, midway failure, timeout/retry, and duplicate submission.

Evidence: [bulk service](../../../apps/api/src/modules/attendance/attendance.service.ts), [DTO](../../../apps/api/src/modules/attendance/attendance.dto.ts), [session entity](../../../apps/api/src/database/entities/attendance-session.entity.ts).

### A3 — High: read-only users receive editing controls

The main attendance route requires `attendance.read`, but its mark, bulk-present, and save controls do not check `attendance.manage`. A read-only user can draft changes and attempt a request that the API rejects. This differs from the teacher drawer, which accepts an explicit management capability.

**Fix:** use the management capability for interaction states and a clear read-only presentation, while retaining API guards. Test a user with read but no manage capability.

Evidence: [AttendancePage](../../../apps/admin/src/features/attendance/pages/AttendancePage.tsx), [AttendanceRosterView](../../../apps/admin/src/features/attendance/views/AttendanceRosterView.tsx), [controller](../../../apps/api/src/modules/attendance/attendance.controller.ts).

### A4 — High: review races and incomplete live refresh

Review uses a read/check/save sequence with no atomic pending-state update or version check; concurrent reviewers can both pass the pending check and overwrite each other's decisions. `attendance.reviewed` recipients include only recorder and reviewer, so another principal/supervisor's queue can stay stale until refreshed. The main page's conflict detector compares `contextId` but not context type/date/session and has no server revision token.

**Fix:** atomically transition pending reviews, return a conflict for the losing decision, scope events precisely, and notify authorized review subscribers. Add concurrent-review and stale-draft tests.

Evidence: [review service](../../../apps/api/src/modules/attendance/attendance.service.ts), [queue subscription](../../../apps/admin/src/features/attendance/components/AttendanceReviewQueue.tsx), [main conflict handling](../../../apps/admin/src/features/attendance/pages/AttendancePage.tsx).

### A5 — Medium: review failures are invisible

Review mutation has `onSuccess` but no visible `onError`. Fetch failures have text without a retry action; the queue's pending/empty state can appear before the first load finishes. Live-record errors are hidden. The query takes the latest 100 absence rows before the UI filters pending, so older pending reviews can disappear from the visible queue.

**Fix:** explicit loading/error/retry states, actionable mutation feedback, and server-side pending filtering with pagination. Expose a review-note input if reviewer explanations are part of the workflow.

Evidence: [queue](../../../apps/admin/src/features/attendance/components/AttendanceReviewQueue.tsx), [service `listAbsenceReviews`](../../../apps/api/src/modules/attendance/attendance.service.ts).

### A6 — Medium: saved-session history is not an editing workflow

Both frontends submit new sessions and never reload a saved session's marks. History displays at most six session headings, with no detail action or date filtering. The service returns an empty `contextLabel` and `remaining=0`, and computes `total` from recorded rows rather than the roster, so a partial save cannot communicate the actual number still unmarked. Main-page success/conflict messages expose API implementation details to users.

**Fix:** define a saved-session detail/edit contract, resolve context names, retain roster totals, and replace implementation text with instructions users can act on.

Evidence: [history and save UI](../../../apps/admin/src/features/attendance/pages/AttendancePage.tsx), [service `listSessions`](../../../apps/api/src/modules/attendance/attendance.service.ts).

### A7 — Medium: organization/role changes can retain stale attendance state

Main-page initial context/history effect depends on `loadVersion`, not active organization/role, and its local drafts are not scoped/reset when those authorities change. Attendance query keys in the review and teacher components also omit organization/user scope. Global auth/query behavior may mitigate some caches, but this page's local state is not explicitly reset.

**Fix:** scope query keys and page state to the authenticated user, active role, and organization; refresh `/me/context` before feature requests. Test a scope switch while a draft or fetch is active.

Evidence: [main effects](../../../apps/admin/src/features/attendance/pages/AttendancePage.tsx), [queue keys](../../../apps/admin/src/features/attendance/components/AttendanceReviewQueue.tsx), [teacher keys](../../../apps/admin/src/features/teacher-portal/components/TeacherClassAttendanceSheet.tsx).

### A8 — Medium: teacher drawer can discard or change a pending draft

Changing entry/open resets marks and reasons without an unsaved-change confirmation. Drawer can close while saving, and mark/reason inputs remain editable during the request. A save always uses “now,” even when entering through a weekly schedule that could describe another day. Status buttons are 36px high, below the 44px target used elsewhere. The selected late button uses white text on amber, which needs contrast review.

**Fix:** prevent duplicate/draft-changing actions during save, confirm draft abandonment, clarify the attendance date, add retry on roster failure, and enlarge/retest status controls.

Evidence: [teacher sheet](../../../apps/admin/src/features/teacher-portal/components/TeacherClassAttendanceSheet.tsx).

### A9 — Medium: student summary failures and context are unclear

The student page handles record-fetch errors, but summary failures leave “summary loading” copy indefinitely and silently use counts from the latest up to 60 rows. Those fallback counts differ from all-time summary totals. The list omits resolved context names and provides no pagination, filtering, or review explanation. It has no event subscription/invalidation within this component for new marks or review decisions.

**Fix:** distinguish loading, all-time summary, and recent-record fallback; offer summary retry; show class/group/room labels and useful review status; add scoped refresh and pagination.

Evidence: [student page](../../../apps/admin/src/features/attendance/pages/MyAttendancePage.tsx), [self API](../../../apps/api/src/modules/attendance/attendance.service.ts).

### A10 — Low/Medium: localization and legacy night attendance are incomplete

Attendance UI copy/date labels are mostly Persian and the main page forces RTL even under an English workspace. The entity permits `night`, and a historical migration advertises it, but current DTO/context parser/UI expose only class/class_group/dorm; no distinct night-attendance screen was found. Night support should not be presented as a working feature. A migration's existence does not verify safe runtime behavior.

**Fix:** translate through the shared locale system and either implement a complete night flow with tests or document the legacy value as unsupported.

Evidence: [main page](../../../apps/admin/src/features/attendance/pages/AttendancePage.tsx), [entity](../../../apps/api/src/database/entities/attendance-session.entity.ts), [DTO](../../../apps/api/src/modules/attendance/attendance.dto.ts), [night migration](../../../apps/api/src/database/migrations/1728234800000-NightAttendance.ts).

## Desktop header changes delivered

- Header uses the same sidebar offset as content, following both collapse states and RTL/LTR direction. It no longer extends underneath either fixed rail.
- Shell uses a column flex layout; the scrollable page consumes remaining viewport height instead of adding another full viewport below the header.
- Desktop account trigger shows a 44px avatar, larger controls, the signed-in name and phone username beside each other, and the actual active role. Name falls back to first/last name before username. Phone stays LTR in Persian layouts and appears in the account popover too.
- Context/organization controls have their own header row; long titles/breadcrumbs can wrap. The clock remains available on wider desktop screens. Breadcrumb/profile text contrast was corrected based on browser accessibility results.

Sources: [DesktopShell](../../../apps/admin/src/app/layout/shell/DesktopShell.tsx), [AdminLayout](../../../apps/admin/src/app/layout/shell/AdminLayout.tsx), [viewport](../../../apps/admin/src/app/layout/shell/SharedPageViewport.tsx), [header](../../../apps/admin/src/app/layout/shell/AdminHeader.tsx), [account menu](../../../apps/admin/src/app/layout/shell/AdminAccountMenu.tsx).

## Screenshots by section

All images below are synthetic local previews of the existing components after the header fix.

| Section                                                 | Image                                                       |
| ------------------------------------------------------- | ----------------------------------------------------------- |
| Principal pending reviews and attendance entry          | [Principal review](images/principal-review.png)             |
| Principal class roster, search, progress, history, save | [Class attendance](images/principal-class-roster.png)       |
| Principal class-group selection/roster                  | [Group attendance](images/principal-group.png)              |
| Principal dorm building/floor/room selection            | [Dorm attendance](images/principal-dorm.png)                |
| Supervisor review workspace                             | [Supervisor review](images/supervisor-review.png)           |
| Teacher weekly schedule attendance entry                | [Teacher schedule](images/teacher-schedule.png)             |
| Teacher status/reason drawer and manager review result  | [Teacher attendance](images/teacher-attendance-reason.png)  |
| Student self-attendance in Admin                        | [Student records](images/student-self-attendance-admin.png) |
| Desktop header at 1200px, compact contextual rail       | [Desktop header](images/desktop-1200.png)                   |
| English LTR dark desktop header                         | [LTR dark header](images/desktop-ltr-dark.png)              |
| Mobile principal review                                 | [Mobile review](images/mobile-principal.png)                |

## Validation

- Admin `npm run typecheck`: passed.
- Admin production build: passed; existing large-chunk/PostCSS warnings remain.
- Focused Vitest run: 8 files, 28 tests passed (account identity, viewport accessibility, geometry, shell selection, main attendance workflow, teacher sheet, dorm notifications, shared notifications).
- Scoped ESLint on changed header/shell files: passed.
- Browser captures: actual components, synthetic API responses; principal, supervisor, teacher and student surfaces rendered without page exceptions.
- Desktop header geometry: 32 combinations passed (1200/1280/1440/1920px, RTL/LTR, both sidebar collapse states); no sidebar intersection or horizontal page overflow, and the page scroll area fills the remaining viewport.
- Header axe checks: zero violations after correcting breadcrumb/profile contrast. This is a header check, not a clean accessibility bill for all attendance screens.
- No production/database mutations were performed. Full monorepo validation was not run; the separate student app is unavailable. No API attendance-specific test file was found among the 37 existing API test files.
