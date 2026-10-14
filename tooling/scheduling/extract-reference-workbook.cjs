#!/usr/bin/env node
/* Read-only staging export for a timetable workbook. It never contacts the API or database. */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const ExcelJS = require("../../apps/admin/node_modules/exceljs");
const ts = require("../../apps/admin/node_modules/typescript");

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
  console.error("Usage: node tooling/scheduling/extract-reference-workbook.cjs <workbook.xlsx> <output-dir>");
  process.exit(2);
}
const days = [
  [6, "شنبه"], [0, "یکشنبه"], [1, "دوشنبه"], [2, "سه‌شنبه"],
  [3, "چهارشنبه"], [4, "پنجشنبه"], [5, "جمعه"],
];
const normalize = (value) => String(value ?? "")
  .normalize("NFKC").replace(/ـ/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک")
  .replace(/[\s‌]+/g, " ").trim();
const digits = (value) => String(value)
  .replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)))
  .replace(/[٠-٩]/g, (c) => String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
const id = (prefix, value) => `${prefix}_${crypto.createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fa"));
function interval(value) {
  const raw = digits(value).trim();
  const match = raw.match(/^(\d{1,2}):([0-5]\d)\s*[-–—]\s*(\d{1,2}):([0-5]\d)$/);
  if (!match || Number(match[1]) > 23 || Number(match[3]) > 23)
    return { startTime: "", endTime: "", issue: raw ? `زمان مبهم: ${value}` : "ساعت زنگ ثبت نشده است." };
  const startTime = `${match[1].padStart(2, "0")}:${match[2]}`;
  const endTime = `${match[3].padStart(2, "0")}:${match[4]}`;
  return endTime > startTime ? { startTime, endTime } : { startTime, endTime, issue: "پایان زنگ باید بعد از شروع باشد." };
}
function day(value) {
  const hits = days.filter(([, name]) => normalize(value).replace(/ /g, "").includes(name)).map(([value]) => value);
  return hits.length === 1 ? hits[0] : null;
}
function cellText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && value.richText) return value.richText.map((part) => part.text).join("");
  if (typeof value === "object" && value.result !== undefined) return cellText(value.result);
  return String(value);
}
function layout(sheet) {
  const cells = new Map();
  for (let row = 1; row <= sheet.rowCount; row++) for (let column = 1; column <= sheet.columnCount; column++) {
    const cell = sheet.getCell(row, column);
    cells.set(`${row}:${column}`, {
      row, column, address: cell.address, master: cell.master.address, merged: cell.isMerged,
      value: normalize(cellText(cell.value)), raw: cellText(cell.value).trim(),
    });
  }
  return cells;
}
function productionParser() {
  const filename = path.resolve(__dirname, "../../apps/admin/src/features/schedule/lib/timetable-workbook.ts");
  const source = fs.readFileSync(filename, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  const mod = { exports: {} };
  new Function("exports", "require", "module", "__filename", "__dirname", compiled)(
    mod.exports, require, mod, filename, path.dirname(filename),
  );
  return mod.exports;
}
const parser = productionParser();
function blocks(cells, rowCount, columnCount) {
  const found = [];
  for (let row = 1; row <= rowCount; row++) {
    const headings = [];
    for (let col = 1; col <= columnCount; col++) {
      const here = cells.get(`${row}:${col}`)?.value || "";
      const next = cells.get(`${row}:${col + 1}`)?.value || "";
      if (here.startsWith("زنگ") && next.includes("مدرس")) headings.push(col);
    }
    let group = [], previousEnd = 0;
    const flush = () => {
      if (!group.length) return;
      const first = group[0];
      let classColumn = first - 1, explicit = false;
      for (let col = previousEnd + 1; col < first; col++) if ((cells.get(`${row}:${col}`)?.value || "") === "کلاس") {
        classColumn = col; explicit = true;
      }
      found.push({ id: `${row}:${classColumn}`, headerRow: row, classColumn, subjectColumns: group, requiresClassColumnConfirmation: !explicit });
      previousEnd = group[group.length - 1]; group = [];
    };
    for (const col of headings) { if (group.length && col > group[group.length - 1] + 2) flush(); group.push(col); }
    flush();
  }
  return found;
}
function extract(sheet) {
  const sourceCells = layout(sheet);
  const source = {
    name: sheet.name,
    rows: sheet.rowCount,
    columns: sheet.columnCount,
    cells: [...sourceCells.values()].map(({ raw, ...cell }) => cell),
  };
  const found = parser.detectWorkbookBlocks(source);
  const parsedLessons = parser.extractWorkbookLessons(source, found);
  const lessons = parsedLessons.map((row) => ({
    stagingId: id("lesson", row.source), source: row.source,
    reviewStatus: row.issues.length ? "needs_review" : "unmapped",
    confidence: row.issues.length ? "low" : "medium",
    sheetName: row.provenance.sheetName, cellAddress: row.provenance.cellAddress,
    masterCell: row.provenance.masterCell, blockId: row.blockId, merged: row.merged,
    classLabel: row.classLabel, subjectLabel: row.subjectLabel, teacherLabel: row.teacherLabel,
    periodLabel: row.periodLabel, rawTimeLabel: row.provenance.rawTimeLabel,
    weekday: row.weekday, startTime: row.startTime, endTime: row.endTime, issues: row.issues,
  }));
  return { blocks: found, lessons };
}
async function main() {
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(fs.readFileSync(input));
  const sheets = workbook.worksheets.map((sheet) => ({ sheet, ...extract(sheet) }));
  const lessons = sheets.flatMap((item) => item.lessons);
  const labels = (field) => unique(lessons.map((item) => item[field]));
  const schoolLabels = unique(workbook.worksheets.flatMap((sheet) =>
    [...Array(sheet.columnCount)].map((_, index) => cellText(sheet.getCell(1, index + 1).value))
      .flatMap((text) => (text.match(/مدرسه[^·\n]+/g) || []).map(normalize))));
  const write = (file, value) => fs.writeFileSync(path.join(output, file), `${JSON.stringify(value, null, 2)}\n`);
  fs.mkdirSync(output, { recursive: true });
  const metadata = { sourceFile: path.basename(input), sha256: crypto.createHash("sha256").update(fs.readFileSync(input)).digest("hex"), mode: "read-only-staging" };
  write("schools.json", { ...metadata, items: schoolLabels.map((label) => ({ stagingId: id("school", label), label, reviewStatus: "needs_review", confidence: "low" })) });
  for (const [file, prefix, field] of [["classes.json", "class", "classLabel"], ["teachers.json", "teacher", "teacherLabel"], ["subjects.json", "subject", "subjectLabel"]])
    write(file, { ...metadata, items: labels(field).map((label) => ({ stagingId: id(prefix, label), label, reviewStatus: "unmapped", confidence: "medium" })) });
  write("books.json", { ...metadata, items: [], note: "No explicit textbook labels were identified; subject-to-book mappings require operator review." });
  write("bell-schedules.json", { ...metadata, items: unique(lessons.map((x) => `${x.periodLabel}|${x.rawTimeLabel}`)).map((key) => { const [periodLabel, rawTimeLabel] = key.split("|"); const parsed = interval(rawTimeLabel); return { stagingId: id("period", key), periodLabel, rawTimeLabel, ...parsed, reviewStatus: parsed.issue ? "needs_review" : "unmapped" }; }) });
  write("timetable-versions.json", { ...metadata, items: sheets.map(({ sheet, blocks: detected }) => ({ stagingId: id("sheet", sheet.name), sheetName: sheet.name, rows: sheet.rowCount, columns: sheet.columnCount, blocks: detected.length, reviewStatus: sheet.rowCount ? "needs_review" : "empty" })) });
  write("scheduled-lessons.json", { ...metadata, items: lessons });
  const ambiguities = lessons.filter((x) => x.issues.length || !x.teacherLabel || x.weekday === null);
  write("import-ambiguities.json", { ...metadata, items: ambiguities });
  const valid = lessons.length - ambiguities.length;
  fs.writeFileSync(path.join(output, "import-validation-report.md"), `# Read-only timetable staging validation\n\n- Source: \`${path.basename(input)}\`\n- SHA-256: \`${metadata.sha256}\`\n- Candidate lessons: ${lessons.length}\n- Ready for explicit entity mapping: ${valid}\n- Needs review: ${ambiguities.length}\n\nNo record in this directory is a production identity or a command to import.\n`);
}
main().catch((error) => { console.error(error); process.exit(1); });
