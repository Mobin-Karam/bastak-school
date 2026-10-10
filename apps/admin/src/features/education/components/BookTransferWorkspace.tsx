import { useState } from "react";
import {
  commitEducationImport,
  exportEducationBooks,
  previewEducationImport,
  type EducationBookInput,
  type EducationImportPreview,
} from "../api/education-catalog.api";
import {
  defineSpreadsheet,
  downloadSpreadsheet,
  readSpreadsheet,
  spreadsheetIssues,
} from "../../../shared/lib/spreadsheet-transfer";
import { useLocale } from "../../../shared/ui/locale";
import { notify } from "../../../shared/ui/notifications";
import { SpreadsheetTransferActions } from "../../../shared/ui/spreadsheet-transfer-actions";
import { Button, Card } from "../../../shared/ui/ui";

type BookRow = {
  id: string;
  schoolYear: string;
  titleFa: string;
  titleEn?: string;
  category: string;
  textbookCode?: string;
  notes?: string;
};
const sheet = defineSpreadsheet<BookRow>({
  sheetName: "ClassBooks",
  columns: [
    { key: "id", header: "شناسه کتاب", required: true },
    { key: "schoolYear", header: "سال تحصیلی", required: true },
    { key: "titleFa", header: "عنوان فارسی", required: true },
    { key: "titleEn", header: "عنوان انگلیسی" },
    { key: "category", header: "دسته", required: true },
    { key: "textbookCode", header: "کد کتاب" },
    { key: "notes", header: "یادداشت" },
  ],
});

export function BookTransferWorkspace({
  organizationId,
  onCompleted,
}: {
  organizationId?: string;
  onCompleted: () => void;
}) {
  const { language } = useLocale();
  const fa = language === "fa";
  const [rows, setRows] = useState<EducationBookInput[]>([]);
  const [preview, setPreview] = useState<EducationImportPreview | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const toInput = (row: BookRow): EducationBookInput => ({
    ...row,
    grade: 0,
    country: "IR",
    level: "class",
    branch: fa ? "کلاس" : "Class",
    track: fa ? "کلاس" : "Class",
    appliesTo: [],
    organizationId,
    state: "PUBLISHED",
  });
  async function importFile(file?: File) {
    if (!file) return;
    try {
      const next = (await readSpreadsheet(file, sheet)).map(toInput);
      setRows(next);
      setIssues([]);
      setBusy(true);
      setPreview(await previewEducationImport(next));
    } catch (error) {
      setRows([]);
      setPreview(null);
      setIssues(
        spreadsheetIssues(error).map(
          (item) =>
            `${item.sheet} · ${fa ? "ردیف" : "row"} ${item.row ?? 1} · ${fa ? "ستون" : "column"} ${item.column ?? ""}`,
        ),
      );
      notify(fa ? "فایل Excel نیاز به اصلاح دارد." : "The Excel file needs correction.", "error");
    } finally {
      setBusy(false);
    }
  }
  async function template() {
    await downloadSpreadsheet(
      sheet,
      [
        {
          id: "class-math-1405",
          schoolYear: "1405-1406",
          titleFa: "ریاضی کلاس",
          titleEn: "Class mathematics",
          category: "درس",
          textbookCode: "",
          notes: "",
        },
      ],
      "class-book-template.xlsx",
    );
  }
  async function exportXlsx() {
    setBusy(true);
    try {
      const exported = await exportEducationBooks();
      await downloadSpreadsheet(
        sheet,
        exported.map((book) => ({
          ...book,
          titleEn: book.titleEn ?? "",
          textbookCode: book.textbookCode ?? "",
          notes: book.notes ?? "",
        })),
        "class-books.xlsx",
      );
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!preview?.valid || !rows.length) return;
    setBusy(true);
    try {
      const result = await commitEducationImport(rows);
      notify(
        fa
          ? `${result.imported.toLocaleString("fa-IR")} کتاب ثبت شد.`
          : `${result.imported} books imported.`,
        "success",
      );
      setRows([]);
      setPreview(null);
      onCompleted();
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="grid gap-4" dir={fa ? "rtl" : "ltr"}>
      <Card className="grid gap-3 p-4">
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          {fa
            ? "این فایل، کتاب‌های قابل افزودن به قفسهٔ کلاس را می‌سازد. خطاها با ردیف و ستون نشان داده می‌شوند."
            : "This workbook creates books for class shelves. Errors identify the row and column to fix."}
        </p>
        <SpreadsheetTransferActions
          canImport
          canExport
          busy={busy}
          onImport={(file) => void importFile(file)}
          onTemplate={() => void template()}
          onExport={() => void exportXlsx()}
        />
        {issues.length ? (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          >
            <strong>{fa ? "اصلاح لازم:" : "Fix required:"}</strong>
            <ul className="mt-1 list-inside list-disc">
              {issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
      {preview ? (
        <Card className="grid gap-3 p-4">
          <p className="text-sm">
            {fa
              ? `معتبر: ${preview.accepted} · خطا: ${preview.rejected}`
              : `Valid: ${preview.accepted} · errors: ${preview.rejected}`}
          </p>
          {preview.rows
            .filter((row) => !row.valid)
            .map((row) => (
              <p key={row.row} className="text-sm text-rose-700">
                {fa ? "ردیف" : "Row"} {row.row}: {row.errors.join("، ")}
              </p>
            ))}
          <div className="flex justify-end">
            <Button disabled={!preview.valid || busy} loading={busy} onClick={() => void commit()}>
              {fa ? "ثبت کتاب‌های معتبر" : "Import valid books"}
            </Button>
          </div>
        </Card>
      ) : null}
    </section>
  );
}
