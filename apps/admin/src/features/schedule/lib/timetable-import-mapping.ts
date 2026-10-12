import type { TimetableWorkspace } from "@moshaver/api-contract";
import { normalizeTimetableText, type WorkbookLesson } from "./timetable-workbook";

/** Suggestions require a unique exact label, never a surname or fuzzy match. */
export function proposeTimetableMappings(
  rows: WorkbookLesson[],
  workspace: TimetableWorkspace,
  confirmed: Record<string, string> = {},
): Record<string, string> {
  const proposed: Record<string, string> = {};
  const same = (a: string, b: string) => normalizeTimetableText(a) === normalizeTimetableText(b);
  for (const row of rows) {
    const classKey = `class:${row.classLabel}`;
    const classes = workspace.classes.filter((x) => same(x.name, row.classLabel));
    if (!confirmed[classKey] && classes.length === 1) proposed[classKey] = classes[0].id;
    const classroom = workspace.classes.find(
      (x) => x.id === (confirmed[classKey] || proposed[classKey]),
    );
    const bookKey = `book:${row.classLabel}|${row.subjectLabel}`;
    const books = classroom?.books.filter((x) => same(x.name, row.subjectLabel)) ?? [];
    if (!confirmed[bookKey] && books.length === 1) proposed[bookKey] = books[0].id;
    const teacherKey = `teacher:${row.teacherLabel}`;
    const teachers = row.teacherLabel
      ? workspace.teachers.filter((x) => same(x.name, row.teacherLabel))
      : [];
    if (!confirmed[teacherKey] && teachers.length === 1) proposed[teacherKey] = teachers[0].id;
    const periodKey = `period:${row.blockId}|${row.periodLabel}|${row.timeLabel}`;
    const periods = workspace.periods.filter(
      (x) =>
        same(x.name, row.periodLabel) && x.startTime === row.startTime && x.endTime === row.endTime,
    );
    if (!confirmed[periodKey] && periods.length === 1) proposed[periodKey] = periods[0].id;
  }
  return proposed;
}
