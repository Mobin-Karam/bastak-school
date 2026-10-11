# School timetable integration

The schedule module owns this feature. It reuses Organization, EducationClass, EducationClassBook/EducationBook (the school's subjects), User teacher accounts, class enrollments, notifications, and AttendanceSession. Existing `/schedule` endpoints and unversioned entries remain compatible. The new `/schedule/timetable` API manages normalized configuration and immutable published versions.

## Workbook evidence

`apps/admin/public/مبین.xlsx` has five worksheets: `اصلی `, `ورقة1`, `ورقه1`, `بدون خواهران `, and `برنامه هفتگی تفکیکی عرضی  (2)`. The last worksheet is empty. The first has side-by-side class columns B and M with subject/teacher pairs; period headings repeat and afternoon timings are partly missing. `ورقة1` is a special Monday/makeup timetable with six periods and the malformed interval `10:20:11:00`. `ورقه1` contains duplicated blocks for the dated Tuesday 1405/07/07 and an overlapping interval `16:20-19:10`; neither duplicates nor those times may be silently corrected. `بدون خواهران ` is explicitly historical (1399–1400), with repeated headings, merged day/class cells, missing bell times, and a second class column without its own heading. Worksheet choice, section, date/term, and time interpretation require user review.

The importer preserves source sheet, coordinates, merge provenance, original text, and mapping issues. It never treats a worksheet as a database table or matches an ambiguous teacher by surname. Repeated/duplicated blocks require explicit inclusion/exclusion. Historical data enters a separately dated draft and is never published automatically.

## Persistence and invariants

Academic years and terms own canonical date ranges and IANA timezones. School sections, locations, bell schedules, daily sessions and periods are related records. SchoolScheduleEntry remains the recurring lesson model and gains version, period, location, effective dates and notes. Versions use optimistic revisions; published entries are immutable. A new draft copies a prior version rather than rewriting its history. Holidays, teacher unavailability, weekly allocations and dated overrides are relational records. Audit/change and import history remain school-scoped.

Conflict detection expands actual dated occurrences in the term, applies holidays and overrides, and compares half-open intervals: adjacent lessons do not overlap. Teacher, class and location conflicts are independent of period indices. Publishing is blocked by unresolved assignments, interval conflicts, availability violations and incomplete weekly allocations. Date changes preserve old published versions and occurrence attendance snapshots.

Lesson occurrences link one published lesson/date to one AttendanceSession. Creating attendance uses the existing class roster and session workflow; cancellation preserves that relationship and records an explicit cancellation. Notifications target affected class students and teachers rather than broadcasting school-wide.

## UI and validation

The same capability-aware page supports staff, teacher and student accounts. Desktop uses horizontally scrollable weekly grids; mobile uses weekday navigation and vertical daily cards. Editors reuse ResponsiveModal (desktop Dialog/mobile Drawer), React Hook Form/Zod and TanStack Query. Drag operations use dnd-kit with a keyboard/editor alternative and rollback after rejection. Print CSS supports RTL and browser Save as PDF.

Required checks include term/timezone edge cases, actual-time overlaps, morning/afternoon bells, holiday/override conflicts, tenant and capability isolation, optimistic revisions, publish immutability, attendance preservation, and workbook mapping provenance. Apply migrations only to disposable databases during feature validation; production deployment remains a separate reviewed release of the completed feature.
