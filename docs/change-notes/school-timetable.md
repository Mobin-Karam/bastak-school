# School timetable integration

The schedule module owns this feature. It reuses Organization, EducationClass, EducationClassBook/EducationBook (the school's subjects), User teacher accounts, class enrollments, notifications, and AttendanceSession. Existing `/schedule` endpoints and unversioned entries remain compatible. The new `/schedule/timetable` API manages normalized configuration and immutable published versions.

## Workbook evidence

`apps/admin/public/timetable-example.xlsx` is a fictional five-sheet workbook. It covers side-by-side class columns, repeated headers, merged cells, duplicated dated blocks, ambiguous intervals, a historical sheet, and an empty sheet. It contains only synthetic class and teacher labels. Personal source workbooks must be uploaded by the authorized operator; never place them in public assets or commit them. Worksheet choice, section, date/term, and time interpretation require user review.

The importer preserves source sheet, coordinates, merge provenance, original text, and mapping issues. It never treats a worksheet as a database table or matches an ambiguous teacher by surname. Repeated/duplicated blocks require explicit inclusion/exclusion. Historical data enters a separately dated draft and is never published automatically.

## Persistence and invariants

Academic years and terms own canonical date ranges and IANA timezones. School sections, locations, bell schedules, daily sessions and periods are related records. SchoolScheduleEntry remains the recurring lesson model and gains version, period, location, effective dates and notes. Versions use optimistic revisions; published entries are immutable. A new draft copies a prior version rather than rewriting its history. Holidays, teacher unavailability, weekly allocations and dated overrides are relational records. Audit/change and import history remain school-scoped.

Conflict detection expands actual dated occurrences in the term, applies holidays and overrides, and compares half-open intervals: adjacent lessons do not overlap. Teacher, class and location conflicts are independent of period indices. Publishing is blocked by unresolved assignments, interval conflicts, availability violations and incomplete weekly allocations. Date changes preserve old published versions and occurrence attendance snapshots.

Lesson occurrences link one published lesson/date to one AttendanceSession. Creating attendance uses the existing class roster and session workflow; cancellation preserves that relationship and records an explicit cancellation. Notifications target affected class students and teachers rather than broadcasting school-wide.

## UI and validation

The same capability-aware page supports staff, teacher and student accounts. Desktop uses horizontally scrollable weekly grids; mobile uses weekday navigation and vertical daily cards. Editors reuse ResponsiveModal (desktop Dialog/mobile Drawer), React Hook Form/Zod and TanStack Query. Drag operations use dnd-kit with a keyboard/editor alternative and rollback after rejection. Print CSS supports RTL and browser Save as PDF.

Required checks include term/timezone edge cases, actual-time overlaps, morning/afternoon bells, holiday/override conflicts, tenant and capability isolation, optimistic revisions, publish immutability, attendance preservation, and workbook mapping provenance. Apply migrations only to disposable databases during feature validation; production deployment remains a separate reviewed release of the completed feature.

## Importing the supplied workbook

Select the school, configure its academic year/term and bell periods, and create or select a draft. Open **ورود اکسل** and either upload a workbook or choose **استفاده از فایل نمونه (داده ساختگی)**. Choose a sheet and explicitly select its blocks; duplicate and historical blocks are independent choices.

The mapping step suggests only unique exact class, class-book, teacher-account and period/time matches. Class-book matches are restricted to the mapped class. Operator choices take precedence. Missing classes can be created with an explicit unique code and school year. Missing class books can be attached through the catalog's additive API (`POST /classes/:id/books`), preserving existing assignment IDs and schedule references. A new book is explicitly created/published using the catalog's existing permission-gated operations before assignment. Teachers must be existing active school accounts; import cannot create passwords, grant roles, or resolve ambiguous surnames.

Set effective dates, explicitly resolve incomplete times with configured bells, and override an individual source row's teacher or weekday where necessary. Preview validates organization scope, class/book/teacher connections and time conflicts before a transaction commits up to 200 lessons. For larger sheets, **انتخاب ۲۰۰ درس بعدی** selects the next batch; committed rows are disabled and mappings stay available until the dialog is closed. Import history and source coordinates remain attached to each batch. Publishing the completed timetable is a separate action.

The import button opens even when no draft is selected. The start dialog lists existing drafts and provides capability-gated links to configuration and draft creation. Creating a draft from this dialog resumes the importer. Changing work context closes stale import/setup dialogs. Class-book updates preserve assignment IDs; removing a class or class-book referenced by versioned lessons or weekly allocations returns a 409 domain error rather than nulling timetable relationships.

## First-run guidance

An empty staff timetable displays a persistent six-step checklist: academic year, term, bell schedule, daily session, period and draft. Progress is derived from scoped server records and follows parent relationships. Focused setup forms preselect the prerequisite parent and refresh the workspace before closing after a successful save. Completed session/period steps support adding more times. Calendar filters remain hidden during initial setup. Once ready, users choose Excel import or manual lesson entry; publication remains a separate review action.

Timetable date controls display and select the Persian calendar while retaining ISO date-only values for the API. Calendar month/year navigation resolves actual calendar dates and clamps leap days; bounded controls open inside their available date range. School timezone controls “today”; date-only labels do not shift dates across timezone boundaries. Time inputs accept Persian/Arabic digits and normalize to 24-hour `HH:mm` before requests, with local interval/session validation. Guided saves advance to the next focused setup form; users can exit and resume saved progress.

Calendar popovers remain inside desktop dialog and mobile drawer focus boundaries, position relative to their enclosing panel, and consume the first Escape without dismissing the setup form. Choosing a date restores focus to its field. Required date fields expose Persian values and errors to assistive technology.

## Release review

The timetable feed uses server-authorized effective work roles. A user with both
STUDENT and TEACHER assignments sees enrolled lessons in the student context
and assigned teaching lessons in the teacher context. When the server authorizes
both roles together, the feed includes both scopes; dated teacher substitutions
still filter each occurrence. Account-wide teacher assignments never override
an explicitly selected student context. Regression coverage exercises this case
alongside school isolation, immutable publication, revision conflicts, atomic
import batches, class-book reference preservation, and attendance history.

The release excludes generated `apps/api/dist-dev` changes. Production compiles
from source and serves only the fictional sample workbook. Operational migration
evidence is recorded in [database rollout](../operations/database-multi-role-integrity-rollout.md).
