import type { CellValue, Worksheet } from "exceljs";

type Scope = "all" | "plans" | "exams";
export type TransferPayload = {
  schemaVersion: "2.0";
  studentId?: string | null;
  organizationId?: string | null;
  plans: Array<Record<string, unknown>>;
  exams: Array<Record<string, unknown>>;
};

const planHeaders = [
  "planDate",
  "published",
  "planTitle",
  "dayLabel",
  "persianDate",
  "jalaliId",
  "motivationText",
  "type",
  "title",
  "subject",
  "description",
  "startTime",
  "endTime",
  "duration",
  "testCount",
  "note",
  "priority",
  "pages",
  "examRef",
  "conflict",
  "conflictGroup",
];
const examHeaders = [
  "externalRef",
  "published",
  "title",
  "subject",
  "durationMinutes",
  "maxAttempts",
  "openAt",
  "closeAt",
  "questionText",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctAnswer",
  "explanation",
  "sortOrder",
  "instructions",
  "syllabusSubject",
  "syllabusDescription",
  "syllabusRequired",
  "syllabusTrack",
];

export async function readTransferWorkbook(
  file: Pick<File, "arrayBuffer">,
): Promise<TransferPayload> {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const plansSheet = workbook.getWorksheet("Plans") || workbook.getWorksheet("برنامه‌ها");
  const examsSheet = workbook.getWorksheet("Exams") || workbook.getWorksheet("آزمون‌ها");
  const plans = plansSheet ? readPlans(plansSheet) : [];
  const exams = examsSheet ? readExams(examsSheet) : [];
  if (!plansSheet && !examsSheet) throw new Error("WORKBOOK_SHEETS_MISSING");
  return { schemaVersion: "2.0", plans, exams };
}

export async function downloadTransferWorkbook(
  payload: TransferPayload,
  scope: Scope,
  filename: string,
) {
  const bytes = await createTransferWorkbook(payload, scope);
  downloadBlob(
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename,
  );
}

export async function createTransferWorkbook(payload: TransferPayload, scope: Scope) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "Moshaver";
  workbook.created = new Date();
  addGuide(workbook.addWorksheet("راهنما", { views: [{ rightToLeft: true }] }), scope);
  if (scope !== "exams")
    addPlans(
      workbook.addWorksheet("Plans", {
        views: [{ state: "frozen", ySplit: 1, rightToLeft: true }],
      }),
      payload.plans,
    );
  if (scope !== "plans")
    addExams(
      workbook.addWorksheet("Exams", {
        views: [{ state: "frozen", ySplit: 1, rightToLeft: true }],
      }),
      payload.exams,
    );
  return workbook.xlsx.writeBuffer();
}

export function examplePayload(scope: Scope): TransferPayload {
  return {
    schemaVersion: "2.0",
    plans:
      scope === "exams"
        ? []
        : [
            {
              date: "2026-09-20",
              published: false,
              title: "شنبه؛ شروع با تمرکز",
              persianDate: "۲۹ شهریور ۱۴۰۵",
              motivationText: "فقط قدم بعدی را انجام بده.",
              tasks: [
                {
                  type: "STUDY",
                  title: "مطالعه فصل اول",
                  subject: "ریاضی",
                  description: "مطالعه و خلاصه‌نویسی",
                  startTime: "08:00",
                  endTime: "09:00",
                  duration: 60,
                  testCount: 0,
                  note: "پس از مطالعه مرور شود",
                  priority: 0,
                  pages: "۸ تا ۲۱",
                },
              ],
            },
          ],
    exams:
      scope === "plans"
        ? []
        : [
            {
              title: "آزمون نمونه ریاضی",
              externalRef: "math-week-1",
              published: false,
              subject: "ریاضی",
              durationMinutes: 60,
              maxAttempts: 1,
              openAt: "2026-09-21T08:00:00.000Z",
              closeAt: "2026-09-21T10:00:00.000Z",
              instructions: ["با دقت پاسخ دهید."],
              syllabus: [
                { subject: "ریاضی", description: "فصل اول", required: true, track: "دوازدهم" },
              ],
              questions: [
                {
                  text: "حاصل ۲ + ۲ کدام است؟",
                  options: ["۱", "۲", "۳", "۴"],
                  correctAnswer: "۴",
                  explanation: "جمع دو و دو برابر چهار است.",
                  sortOrder: 0,
                },
              ],
            },
          ],
  };
}

function readPlans(sheet: Worksheet) {
  const rows = rowsAsObjects(sheet, planHeaders);
  const grouped = new Map<
    string,
    {
      date: string;
      published: boolean;
      title: string;
      dayLabel: string;
      persianDate: string;
      jalaliId: string;
      motivationText: string;
      tasks: Array<Record<string, unknown>>;
    }
  >();
  for (const row of rows) {
    const date = text(row.planDate);
    if (!date && !text(row.title)) continue;
    const plan = grouped.get(date) || {
      date,
      published: truthy(row.published),
      title: text(row.planTitle),
      dayLabel: text(row.dayLabel),
      persianDate: text(row.persianDate),
      jalaliId: text(row.jalaliId),
      motivationText: text(row.motivationText),
      tasks: [],
    };
    plan.tasks.push({
      type: text(row.type) || "STUDY",
      title: text(row.title),
      subject: text(row.subject),
      description: text(row.description),
      startTime: text(row.startTime),
      endTime: text(row.endTime),
      duration: number(row.duration),
      testCount: number(row.testCount),
      note: text(row.note),
      priority: number(row.priority),
      pages: text(row.pages),
      examRef: text(row.examRef),
      conflict: truthy(row.conflict),
      conflictGroup: text(row.conflictGroup),
    });
    grouped.set(date, plan);
  }
  return [...grouped.values()];
}

function readExams(sheet: Worksheet) {
  const rows = rowsAsObjects(sheet, examHeaders);
  const grouped = new Map<string, Record<string, any>>();
  for (const row of rows) {
    const title = text(row.title);
    if (!title && !text(row.questionText)) continue;
    const key = `${title}\u0000${text(row.openAt)}`;
    const exam = grouped.get(key) || {
      title,
      subject: text(row.subject),
      durationMinutes: number(row.durationMinutes),
      maxAttempts: number(row.maxAttempts),
      openAt: nullable(row.openAt),
      closeAt: nullable(row.closeAt),
      externalRef: text(row.externalRef),
      published: truthy(row.published),
      instructions: text(row.instructions) ? [text(row.instructions)] : [],
      syllabus: [],
      questions: [],
    };
    const syllabusSubject = text(row.syllabusSubject);
    if (
      syllabusSubject &&
      !exam.syllabus.some((item: Record<string, unknown>) => item.subject === syllabusSubject)
    )
      exam.syllabus.push({
        subject: syllabusSubject,
        description: text(row.syllabusDescription),
        required: truthy(row.syllabusRequired),
        track: text(row.syllabusTrack),
      });
    const questionText = text(row.questionText);
    if (questionText)
      exam.questions.push({
        text: questionText,
        options: [text(row.optionA), text(row.optionB), text(row.optionC), text(row.optionD)],
        correctAnswer: text(row.correctAnswer),
        explanation: text(row.explanation),
        sortOrder: number(row.sortOrder),
      });
    grouped.set(key, exam);
  }
  return [...grouped.values()];
}

function rowsAsObjects(sheet: Worksheet, expected: string[]) {
  const headers = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, column) => headers.set(text(cell.value).trim(), column));
  const missing = expected.filter((header) => !headers.has(header));
  if (missing.length) throw new Error(`MISSING_COLUMNS:${missing.join(",")}`);
  const rows: Array<Record<string, CellValue>> = [];
  for (let index = 2; index <= sheet.rowCount; index += 1) {
    const item: Record<string, CellValue> = {};
    for (const header of expected)
      item[header] = sheet.getRow(index).getCell(headers.get(header)!).value;
    rows.push(item);
  }
  return rows;
}

function addGuide(sheet: Worksheet, scope: Scope) {
  sheet.columns = [{ width: 24 }, { width: 80 }];
  sheet.addRows([
    [
      "قالب انتقال داده مشاور",
      "سلول‌های نمونه را ویرایش کنید؛ نام ستون‌ها و نام برگه‌های انگلیسی را تغییر ندهید.",
    ],
    ["محدوده", scope],
    ["تاریخ برنامه", "YYYY-MM-DD"],
    ["زمان فعالیت", "HH:mm"],
    ["زمان آزمون", "ISO-8601 مانند 2026-09-21T08:00:00.000Z"],
    ["نوع فعالیت", "STUDY, TEST, REVIEW, EXAM, REST, CUSTOM, CLASS, PRAYER, MEAL, BREAK"],
    ["پیوند آزمون", "examRef باید با externalRef آزمون یکسان باشد."],
    ["پاسخ صحیح", "باید دقیقاً با یکی از چهار گزینه برابر باشد."],
  ]);
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  sheet.getColumn(2).alignment = { wrapText: true, vertical: "top" };
}

function addPlans(sheet: Worksheet, plans: Array<Record<string, any>>) {
  sheet.columns = planHeaders.map((header) => ({
    header,
    key: header,
    width: ["title", "planTitle", "description", "note", "motivationText"].includes(header)
      ? 28
      : 16,
  }));
  for (const plan of plans)
    for (const task of plan.tasks || [])
      sheet.addRow({
        planDate: plan.date || plan.planDate,
        published: Boolean(plan.published),
        planTitle: plan.title,
        dayLabel: plan.dayLabel,
        persianDate: plan.persianDate,
        jalaliId: plan.jalaliId,
        motivationText: plan.motivationText,
        ...task,
      });
  styleTable(sheet, planHeaders.length);
}

function addExams(sheet: Worksheet, exams: Array<Record<string, any>>) {
  sheet.columns = examHeaders.map((header) => ({
    header,
    key: header,
    width: ["questionText", "explanation"].includes(header) ? 34 : 18,
  }));
  for (const exam of exams) {
    const questions = exam.questions?.length ? exam.questions : [{}];
    const syllabus = exam.syllabus?.length ? exam.syllabus : [{}];
    const rows = Math.max(questions.length, syllabus.length);
    for (let index = 0; index < rows; index += 1) {
      const question = questions[index] || {};
      const syllabusItem = syllabus[index] || {};
      sheet.addRow({
        title: exam.title,
        externalRef: exam.externalRef,
        published: Boolean(exam.published),
        subject: exam.subject,
        durationMinutes: exam.durationMinutes,
        maxAttempts: exam.maxAttempts,
        openAt: iso(exam.openAt),
        closeAt: iso(exam.closeAt),
        questionText: question.text,
        optionA: question.options?.[0],
        optionB: question.options?.[1],
        optionC: question.options?.[2],
        optionD: question.options?.[3],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        sortOrder: question.sortOrder,
        instructions: Array.isArray(exam.instructions)
          ? exam.instructions.join("\n")
          : exam.instructions,
        syllabusSubject: syllabusItem.subject,
        syllabusDescription: syllabusItem.description,
        syllabusRequired: syllabusItem.required,
        syllabusTrack: syllabusItem.track,
      });
    }
  }
  styleTable(sheet, examHeaders.length);
}

function styleTable(sheet: Worksheet, columns: number) {
  const header = sheet.getRow(1);
  header.height = 26;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  header.alignment = { vertical: "middle", horizontal: "center" };
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, sheet.rowCount), column: columns },
  };
  for (let row = 2; row <= sheet.rowCount; row += 1)
    sheet.getRow(row).alignment = { vertical: "top", wrapText: true };
}

function text(value: CellValue | undefined) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "text" in value) return String(value.text);
  if (typeof value === "object" && "result" in value) return String(value.result ?? "");
  return String(value).trim();
}
function number(value: CellValue | undefined) {
  const parsed = Number(text(value));
  return Number.isFinite(parsed) ? parsed : 0;
}
function truthy(value: CellValue | undefined) {
  return ["true", "1", "yes", "بله"].includes(text(value).toLowerCase());
}
function nullable(value: CellValue | undefined) {
  const result = text(value);
  return result || null;
}
function iso(value: unknown) {
  return value ? new Date(String(value)).toISOString() : "";
}
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
