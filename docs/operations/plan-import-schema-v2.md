# Moshaver JSON and Excel Import Guide — schemaVersion 2.0

Admin can import plans and timed exams for the **student currently selected in the Admin top bar**. The selected Admin student is authoritative: a copied `studentId` inside the JSON is ignored/overridden so the file cannot silently target the wrong account.

Recommended flow:

```text
Select student in Admin
  → Planner / Exams → JSON
  → upload or paste JSON
  → Preview + validation
  → fix conflicts / warnings
  → Import as Draft OR Import + Publish
  → database
  → Student sees published content
```

## Full schema example

```json
{
  "schemaVersion": "2.0",
  "scope": "all",
  "plans": [
    {
      "date": "2026-08-20",
      "published": false,
      "tasks": [
        {
          "startTime": "07:00",
          "endTime": "08:10",
          "type": "STUDY",
          "subject": "روان‌شناسی",
          "title": "مطالعه فعال درس ۱",
          "description": "صفحه ۸ تا ۲۱؛ مطالعه و بازیابی فعال",
          "duration": 70,
          "testCount": 0,
          "note": "بعد از مطالعه کتاب را ببند و بازیابی کن"
        }
      ]
    }
  ],
  "exams": [
    {
      "title": "آزمون نمونه",
      "openAt": "2026-08-21T08:00:00+03:30",
      "closeAt": "2026-08-21T10:00:00+03:30",
      "durationMinutes": 60,
      "maxAttempts": 1,
      "questions": [
        {
          "text": "صورت سؤال نمونه",
          "options": ["گزینه اول", "گزینه دوم", "گزینه سوم", "گزینه چهارم"],
          "correctAnswer": "گزینه دوم",
          "explanation": "توضیح پاسخ صحیح"
        }
      ]
    }
  ]
}
```

Use the string `"2.0"` for new files. Numeric or string `2` files from the advisor export are accepted and normalized to `"2.0"`. Every exam question must have exactly four distinct, non-empty options, and `correctAnswer` must exactly equal one of those option texts. Legacy `correctOption` values (`a`–`d`) are also converted to the matching option during import.

Task types accepted by the current importer are `STUDY`, `TEST`, `REVIEW`, `EXAM`, `REST`, `CUSTOM`, `CLASS`, `PRAYER`, `MEAL`, and `BREAK` (case-insensitive input is normalized). Use `startTime`/`endTime` in `HH:mm`; `start`/`end` are also accepted for JSON compatibility. Rich plans may also include `motivationText`, task `pages`, `conflict`, `conflictGroup`, and an `examId`/`examRef` that matches an imported exam `ref`.

A day is one plan object. A week is normally seven plan objects. A month is 28–31 plan objects; there is no separate month schema because the Admin calendar groups plan dates automatically.

## Timed exam behavior

- `published: false`: Student cannot start it.
- Before `openAt`: visible as scheduled/locked, but Start is disabled by the backend.
- Between `openAt` and `closeAt`: Start becomes available if questions exist and an attempt is available.
- Default `maxAttempts` is `1`.
- Reopening the same active attempt resumes it; it does not consume a second attempt.
- After a submitted attempt exhausts the limit, Student can request another try.
- Advisor approves/rejects that request in Admin. Approval grants one additional attempt for the approval window.

## Preview and commit guarantees

Preview does not write anything. Commit uses a database transaction. Existing same-date plans and same-title/date exams are rejected unless the Advisor explicitly enables the relevant replacement checkbox.

Use **Import as Draft** for large week/month files, inspect Day/Week/Month in Admin, then publish the chosen range. Use **Import + Publish** only when the preview is already final.

See [`examples/week-plan-and-exam-v2.json`](../../examples/week-plan-and-exam-v2.json) for a ready-to-edit, API-compatible file.

## Excel template

In Admin, select the student first, then choose **نمونه Excel**. The generated workbook is already compatible with this schema and contains a Persian guide sheet plus `Plans` and `Exams` sheets. Do not rename the English sheet names or first-row column names.

For plans, use one row per task. Repeat `planDate` for every task on the same day. Required columns are:

```text
planDate, published, planTitle, dayLabel, persianDate, jalaliId, motivationText, type, title, subject, description, startTime, endTime, duration, testCount, note, priority, pages, examRef, conflict, conflictGroup
```

For exams, use one row per question. Repeat the exam information for every question. Required columns are:

```text
externalRef, published, title, subject, durationMinutes, maxAttempts, openAt, closeAt, questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, sortOrder, instructions, syllabusSubject, syllabusDescription, syllabusRequired, syllabusTrack
```

`correctAnswer` must be the full text of one of `optionA` through `optionD`, not `A`, `B`, `1`, or `2`.

## Legacy examples

For the current importer, use [`examples/week-plan-and-exam-v2.json`](../../examples/week-plan-and-exam-v2.json) or the Admin-generated JSON/Excel templates. `schemaVersion: 1` is unsupported. Advisor exports using numeric/string `2`, plan `motivationText`, or task `examRef` are accepted for migration and normalized to v2.
