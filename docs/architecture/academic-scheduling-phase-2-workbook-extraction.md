# Academic scheduling: Phase 2 workbook extraction

Status: read-only extraction completed against the supplied
`docs/reference/مبین.xlsx` in the active shared checkout. No timetable,
attendance, academic, or identity record was written.

## Input identity

| Field | Value |
| --- | --- |
| Source file | `docs/reference/مبین.xlsx` |
| SHA-256 | `696637cd570cefdb06a351249890c210b53a7573fd924c1ed1a0aea2fabc5bfa` |
| Layout direction | RTL on every sheet |
| Extraction method | Existing `readSpreadsheetLayout`, `detectWorkbookBlocks`, and `extractWorkbookLessons` logic, evaluated read-only against the supplied file |

This document reports source labels exactly as read. It does not claim that any
teacher, class, subject, school, or book label is a production identity.

## Sheet catalogue and classification

| Sheet | Shape / merged ranges | Candidate lessons | Classification | Review result |
| --- | --- | ---: | --- | --- |
| `اصلی ` | 69 x 23 / 62 | 178 | Weekly schedule, school and sisters' school named together | Needs context separation and afternoon-header repair |
| `ورقة1` | 10 x 13 / 8 | 42 | Special or unresolved timetable context | No explicit weekday; one malformed time label |
| `ورقه1` | 15 x 10 / 12 | 32 | Separate weekly/special context | Structurally parseable; context/year is unresolved |
| `بدون خواهران ` | 36 x 19 / 18 | 12 from current parser | Historical context; title contains `سال تحصیلی 1400-1399` | Current block detector is not safe for this layout |
| `برنامه هفتگی تفکیکی عرضی  (2)` | empty | 0 | Empty | Ignore with an auditable empty-sheet result |

The raw source title of the main sheet names both `مدرسه سلطان العلماء` and
`مدرسه فکری خواهران بستک`. It is insufficient evidence to merge those into one
organization or timetable version. The historical title is retained as written;
no Gregorian date range or active year is inferred.

## Read-only relationship inventory

The current parser produced 264 candidate lesson cells before staff mapping.
Only 76 have no structural issue. The remaining 188 must remain in staging.

### Source labels

- School labels: `مدرسه سلطان العلماء`, `مدرسه فکری خواهران بستک` (from the
  combined main-sheet title; both are source labels only).
- Academic-year label: `سال تحصیلی 1400-1399` (historical sheet title only).
- Class labels: `اول الف`, `اول ب`, `اول ج`, `اول خ`, `اول د`, `دوم`, `دوم الف`,
  `دوم ب`, `دوم خ`, `دوم دیپلمه خ`, `سوم`, `سوم خ`, `چهارم`, `چهارم خ`.
- Subject labels: `اصول`, `اصول دعوت`, `بلاغه`, `تاریخ`, `تاریخ خلفا`, `تجوید`,
  `ترجمه`, `تفسیر`, `حدیث`, `حفظ`, `سیرت`, `صرف`, `عقیده`, `علوم قرآن`, `فقه`,
  `قرائت`, `قصص`, `لغت`, `مصطلح`, `مفردات`, `منطق`, `مهارت`, `میراث`, `نحو`,
  `نصوص`.
- Teacher labels: 30 distinct source strings. They include near-looking labels
  such as `دست برسر`, `دست برسر ح`, and `دستر برسر ح`, plus `محمودی که` and
  `محمودی کو`. These must never be auto-merged.
- Book labels: none are explicit in the workbook. Every subject-to-book mapping
  is therefore `UNKNOWN` until an operator selects an existing class-book or
  creates a reviewed catalog reference.

## Time and provenance findings

Every candidate retains a `Sheet!Cell` source location in the current importer
(for example `اصلی !P4`). The source contains these distinct time labels:

- parseable examples: `7:30-8:20`, `8:30-9:20`, `9:30-10:20`,
  `10:40-11:30`, `11:40-12:30`, `16:00-16:45`, `16:55-17:40`;
- malformed values that must remain unresolved: `16:00-16-50`, `17:00-17-50`,
  `10:20:11:00`;
- absent header cells for several afternoon columns; and
- non-time values read as headers in the historical layout when its block
  structure is misidentified.

The current parser reports 47 rows for `17:00-17-50`, 21 rows for
`16:00-16-50`, 66 rows with a missing period time, 42 rows without an explicit
weekday, and 7 rows with `10:20:11:00`. These are staging errors, not data to
coerce or publish.

## Contract comparison

`TimetableImportRow` currently requires a resolved `classroomId`, `classBookId`,
`teacherId`, `periodId`, `weekday`, valid `HH:mm` start/end times, and date
bounds. The existing wizard already requires explicit mappings and previews the
candidate through `/schedule/timetable/versions/:id/import/preview` before
commit. That is compatible with safe import, but the workbook's raw layout is
not yet fully represented by the parser.

| Requirement | Current result | Phase 3 action |
| --- | --- | --- |
| RTL and merged cells | Partial | Preserve merge regions and derive header values from their master cells. |
| Multiple schedule contexts | Partial | Require the operator to classify/choose an organization and timetable version per sheet/block. |
| Repeated headers | Partial | Give every block a stable unique identity; do not key a block only by header row and class column. |
| Missing/malformed time | Safe rejection | Keep rejection; add a reviewable source-time correction that is not an automatic inference. |
| Teacher/class/book matching | Safe exact-match suggestion | Retain exact unique matching only; no fuzzy merge. |
| Historical preservation | Partial | Persist source context and year label in import provenance before any commit. |
| Idempotent reimport | Unverified for source workbook | Define an approved mapping fingerprint and test duplicate commits. |

## Phase 3 implementation boundary

Phase 3 must extend the existing timetable importer rather than add a parallel
Excel path. It must first repair structural extraction and add fixture coverage
for this workbook's cases: merged afternoon headers, repeated header blocks,
missing weekday, malformed times, historical title, and similar-looking teacher
labels. It must still block unresolved rows at preview/commit and leave
publication as a separate explicit operation.
