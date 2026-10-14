import type { SpreadsheetLayoutSheet } from "../../../shared/lib/spreadsheet-transfer";
export const persianWeekdays = [
  { id: 6, name: "شنبه" },
  { id: 0, name: "یکشنبه" },
  { id: 1, name: "دوشنبه" },
  { id: 2, name: "سه‌شنبه" },
  { id: 3, name: "چهارشنبه" },
  { id: 4, name: "پنجشنبه" },
  { id: 5, name: "جمعه" },
];
export function normalizeTimetableText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/ـ/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\s‌]+/g, " ")
    .trim();
}
export type WorkbookBlock = {
  id: string;
  headerRow: number;
  classColumn: number;
  subjectColumns: number[];
  label: string;
  requiresClassColumnConfirmation: boolean;
};
export type WorkbookLesson = {
  source: string;
  blockId: string;
  classLabel: string;
  subjectLabel: string;
  teacherLabel: string;
  periodLabel: string;
  timeLabel: string;
  startTime: string;
  endTime: string;
  weekday: number | null;
  issues: string[];
  merged: boolean;
};
function daysInText(value: string): number[] {
  let remaining = normalizeTimetableText(value).replace(/ /g, "");
  const days: number[] = [];
  for (const entry of [...persianWeekdays].sort((a, b) => b.name.length - a.name.length)) {
    const name = normalizeTimetableText(entry.name).replace(/ /g, "");
    if (remaining.includes(name)) {
      days.push(entry.id);
      remaining = remaining.split(name).join("");
    }
  }
  return days;
}
function day(value: string) {
  const matches = daysInText(value);
  return matches.length === 1 ? matches[0] : null;
}
function digits(value: string) {
  return value
    .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
    .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
}
export function parseWorkbookInterval(value: string): {
  startTime: string;
  endTime: string;
  issue?: string;
} {
  const clean = digits(value.trim());
  const match = clean.match(/^(\d{1,2}):([0-5]\d)\s*[-–—]\s*(\d{1,2}):([0-5]\d)$/);
  if (!match || Number(match[1]) > 23 || Number(match[3]) > 23)
    return {
      startTime: "",
      endTime: "",
      issue: clean ? `زمان مبهم: ${value}` : "ساعت زنگ ثبت نشده است.",
    };
  const startTime = `${match[1].padStart(2, "0")}:${match[2]}`,
    endTime = `${match[3].padStart(2, "0")}:${match[4]}`;
  return endTime > startTime
    ? { startTime, endTime }
    : { startTime, endTime, issue: "پایان زنگ باید بعد از شروع باشد." };
}
export function detectWorkbookBlocks(sheet: SpreadsheetLayoutSheet): WorkbookBlock[] {
  const blocks: WorkbookBlock[] = [];
  for (let row = 1; row <= sheet.rows; row++) {
    const headings = sheet.cells.filter(
      (x) =>
        x.row === row &&
        normalizeTimetableText(x.value).startsWith("زنگ") &&
        normalizeTimetableText(
          sheet.cells.find((c) => c.row === row && c.column === x.column + 1)?.value ?? "",
        ).includes("مدرس"),
    );
    let group: number[] = [];
    let previousGroupEnd = 0;
    const flush = () => {
      if (!group.length) return;
      const first = group[0];
      const explicit = sheet.cells
        .filter(
          (x) =>
            x.row === row &&
            x.column < first &&
            x.column > previousGroupEnd &&
            normalizeTimetableText(x.value) === "کلاس",
        )
        .at(-1);
      const classColumn = explicit?.column ?? first - 1;
      blocks.push({
        id: `${row}:${classColumn}`,
        headerRow: row,
        classColumn,
        subjectColumns: group,
        label: `ردیف ${row} · ستون کلاس ${classColumn} · ${group.length} زنگ`,
        requiresClassColumnConfirmation: !explicit,
      });
      previousGroupEnd = group.at(-1)!;
      group = [];
    };
    for (const heading of headings) {
      if (group.length && heading.column > group.at(-1)! + 2) flush();
      group.push(heading.column);
    }
    flush();
  }
  return blocks;
}
export function extractWorkbookLessons(
  sheet: SpreadsheetLayoutSheet,
  blocks: WorkbookBlock[],
): WorkbookLesson[] {
  const cells = new Map(sheet.cells.map((x) => [`${x.row}:${x.column}`, x]));
  const textAt = (row: number, col: number) => cells.get(`${row}:${col}`)?.value ?? "";
  const lessons: WorkbookLesson[] = [];
  const titleDays = sheet.cells.filter((x) => x.row === 1).flatMap((x) => daysInText(x.value));
  const uniqueTitleDays = [...new Set(titleDays.filter((x) => x !== null))];
  const titleDay = uniqueTitleDays.length === 1 ? uniqueTitleDays[0] : null;
  for (const block of blocks) {
    const nextHeader =
      detectWorkbookBlocks(sheet)
        .filter(
          (x) => x.classColumn === Number(block.id.split(":")[1]) && x.headerRow > block.headerRow,
        )
        .map((x) => x.headerRow)
        .sort((a, b) => a - b)[0] ?? sheet.rows + 1;
    let carriedDay = titleDay;
    let carriedClass = "";
    for (let row = block.headerRow + 1; row < nextHeader; row++) {
      const explicitDay = day(textAt(row, 1));
      if (explicitDay !== null) carriedDay = explicitDay;
      const classCell = cells.get(`${row}:${block.classColumn}`);
      const classText = normalizeTimetableText(classCell?.value ?? "");
      if (classText === "ساعت" || classText === "کلاس") continue;
      carriedClass = classText;
      if (!carriedClass) continue;
      for (const column of block.subjectColumns) {
        const cell = cells.get(`${row}:${column}`);
        const subjectLabel = normalizeTimetableText(cell?.value ?? "");
        if (!subjectLabel || subjectLabel.startsWith("زنگ") || subjectLabel === "مدرس") continue;
        // A merge across distinct lesson columns is ambiguous, not repeated assignments.
        if (
          cell?.merged &&
          cell.address !== cell.master &&
          cells.get(`${row}:${column - 1}`)?.master === cell.master
        )
          continue;
        const teacherCell = cells.get(`${row}:${column + 1}`);
        const teacherLabel = normalizeTimetableText(teacherCell?.value ?? "");
        const timeLabel = textAt(block.headerRow + 1, column);
        const interval = parseWorkbookInterval(timeLabel);
        const issues: string[] = [];
        if (carriedDay === null) issues.push("روز هفته را صریح انتخاب کنید.");
        if (interval.issue) issues.push(interval.issue);
        if (!teacherLabel) issues.push("استاد در منبع مشخص نیست.");
        if (cell?.merged && teacherCell?.master === cell.master)
          issues.push("ادغام سلول درس و استاد؛ مقدار را بازبینی کنید.");
        lessons.push({
          source: `${sheet.name}!${cell?.address ?? `${row}:${column}`}`,
          blockId: block.id,
          classLabel: carriedClass,
          subjectLabel,
          teacherLabel,
          periodLabel: normalizeTimetableText(textAt(block.headerRow, column)),
          timeLabel,
          ...interval,
          weekday: carriedDay,
          issues,
          merged: cell?.merged ?? false,
        });
      }
    }
  }
  return lessons;
}
