import type { CellValue, Worksheet } from "exceljs";

export type QuestionBankTransferQuestion = {
  organizationId: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  subject: string;
  topic: string;
  book: string;
  grade: string;
  chapter: string;
  lesson: string;
  difficulty: string;
  source: string;
  tags: string[];
  bankType?: "exam" | "quiz";
};
export type QuestionBankTransfer = {
  schemaVersion: "1.0";
  bankType: "exam" | "quiz";
  questions: QuestionBankTransferQuestion[];
};

const headers = [
  "organizationId",
  "text",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "correctAnswer",
  "explanation",
  "subject",
  "topic",
  "book",
  "grade",
  "chapter",
  "lesson",
  "difficulty",
  "source",
  "tags",
];

export async function readQuestionBankWorkbook(
  file: Pick<File, "arrayBuffer">,
  bankType: "exam" | "quiz",
): Promise<QuestionBankTransfer> {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.getWorksheet("Questions") || workbook.getWorksheet("سؤال‌ها");
  if (!sheet) throw new Error("WORKBOOK_SHEET_MISSING");
  const columns = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, column) => columns.set(text(cell.value), column));
  const missing = headers.filter((header) => !columns.has(header));
  if (missing.length) throw new Error(`MISSING_COLUMNS:${missing.join(",")}`);
  const questions: QuestionBankTransferQuestion[] = [];
  for (let row = 2; row <= sheet.rowCount; row += 1) {
    const value = (key: string) => text(sheet.getRow(row).getCell(columns.get(key)!).value);
    if (!value("text")) continue;
    questions.push({
      organizationId: value("organizationId"),
      text: value("text"),
      options: [value("optionA"), value("optionB"), value("optionC"), value("optionD")],
      correctAnswer: value("correctAnswer"),
      explanation: value("explanation"),
      subject: value("subject"),
      topic: value("topic"),
      book: value("book"),
      grade: value("grade"),
      chapter: value("chapter"),
      lesson: value("lesson"),
      difficulty: value("difficulty") || "medium",
      source: value("source"),
      tags: value("tags")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      bankType,
    });
  }
  return { schemaVersion: "1.0", bankType, questions };
}

export async function downloadQuestionBankWorkbook(data: QuestionBankTransfer, filename: string) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "Moshaver";
  const guide = workbook.addWorksheet("راهنما", { views: [{ rightToLeft: true }] });
  guide.columns = [{ width: 24 }, { width: 92 }];
  guide.addRows([
    [
      "قالب بانک سؤال",
      "ردیف نمونه را ویرایش یا کپی کنید. نام ستون‌ها و برگه Questions را تغییر ندهید.",
    ],
    ["چهار گزینه", "چهار گزینه باید یکتا باشند و correctAnswer دقیقاً با یکی از آن‌ها برابر باشد."],
    ["سازمان", "organizationId لازم است؛ آن را از خروجی بانک یا داده نمونه کپی کنید."],
    ["برچسب‌ها", "برچسب‌ها را با کامای انگلیسی جدا کنید."],
  ]);
  style(guide, 2);
  const sheet = workbook.addWorksheet("Questions", {
    views: [{ state: "frozen", ySplit: 1, rightToLeft: true }],
  });
  sheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: ["text", "explanation"].includes(header) ? 38 : header === "tags" ? 25 : 18,
  }));
  for (const question of data.questions)
    sheet.addRow({
      organizationId: question.organizationId,
      text: question.text,
      optionA: question.options[0],
      optionB: question.options[1],
      optionC: question.options[2],
      optionD: question.options[3],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      subject: question.subject,
      topic: question.topic,
      book: question.book,
      grade: question.grade,
      chapter: question.chapter,
      lesson: question.lesson,
      difficulty: question.difficulty,
      source: question.source,
      tags: question.tags.join(", "),
    });
  style(sheet, headers.length);
  download(
    new Blob([await workbook.xlsx.writeBuffer()], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename,
  );
}

export function downloadQuestionBankJson(data: QuestionBankTransfer, filename: string) {
  download(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), filename);
}
function style(sheet: Worksheet, count: number) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, sheet.rowCount), column: count },
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
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
