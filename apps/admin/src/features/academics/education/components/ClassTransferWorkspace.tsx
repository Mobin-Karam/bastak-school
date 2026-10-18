import { useState } from "react";
import {
  commitClassTransfer,
  exportClassTransfer,
  previewClassTransfer,
  type ClassTransferPreview,
  type ClassTransferRow,
} from "../api/classes.api.ts";
import {
  defineSpreadsheet,
  downloadSpreadsheet,
  readSpreadsheet,
  spreadsheetIssues,
} from "../../../../shared/lib/spreadsheet-transfer";
import { useLocale } from "../../../../shared/ui/locale";
import { notify } from "../../../../shared/ui/notifications";
import { SpreadsheetTransferActions } from "../../../../shared/ui/spreadsheet-transfer-actions";
import { Button, Card, EmptyState } from "../../../../shared/ui/ui";
import { FileSpreadsheet, FileUp } from "lucide-react";

const classSheet = defineSpreadsheet<ClassTransferRow>({
  sheetName: "Classes",
  columns: [
    { key: "code", header: "کد کلاس", required: true },
    { key: "name", header: "نام کلاس", required: true },
    { key: "schoolYear", header: "سال تحصیلی", required: true },
    { key: "capacity", header: "ظرفیت", read: (value) => Number(value) || undefined },
  ],
});

export function ClassTransferWorkspace({
  organizationId,
  canImport,
  canExport,
  onCompleted,
}: {
  organizationId: string;
  canImport: boolean;
  canExport: boolean;
  onCompleted: () => void;
}) {
  const { language } = useLocale();
  const [rows, setRows] = useState<ClassTransferRow[]>([]);
  const [preview, setPreview] = useState<ClassTransferPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [fileIssues, setFileIssues] = useState<string[]>([]);
  const ready = Boolean(organizationId);
  const fa = language === "fa";

  async function pick(file?: File) {
    if (!file || !ready) return;
    try {
      const next = await readSpreadsheet(file, classSheet);
      setRows(next);
      setFileIssues([]);
      setBusy(true);
      setPreview(await previewClassTransfer(organizationId, next));
    } catch (error) {
      setRows([]);
      setPreview(null);
      const issues = spreadsheetIssues(error);
      setFileIssues(
        issues.map((issue) =>
          fa
            ? `برگه «${issue.sheet}» · ردیف ${issue.row ?? 1} · ستون «${issue.column ?? "نامشخص"}»`
            : `Sheet “${issue.sheet}” · row ${issue.row ?? 1} · column “${issue.column ?? "unknown"}”`,
        ),
      );
      notify(
        error instanceof Error
          ? error.message
          : fa
            ? "فایل Excel معتبر نیست."
            : "The Excel file is invalid.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }
  async function downloadTemplate() {
    await downloadSpreadsheet(
      classSheet,
      [
        {
          code: "12-exp-a",
          name: fa ? "دوازدهم تجربی الف" : "Grade 12 Science A",
          schoolYear: "1405-1406",
          capacity: 35,
        },
      ],
      "class-import-template.xlsx",
    );
  }
  async function exportXlsx() {
    if (!ready) return;
    setBusy(true);
    try {
      await downloadSpreadsheet(
        classSheet,
        await exportClassTransfer(organizationId),
        "classes.xlsx",
      );
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!ready || !rows.length) return;
    setBusy(true);
    try {
      const result = await commitClassTransfer(organizationId, rows);
      if (!result.committed) {
        setPreview(await previewClassTransfer(organizationId, rows));
        return;
      }
      notify(
        fa
          ? `${result.count.toLocaleString("fa-IR")} کلاس ثبت شد.`
          : `${result.count} classes imported.`,
        "success",
      );
      setRows([]);
      setPreview(null);
      onCompleted();
    } finally {
      setBusy(false);
    }
  }
  if (!ready)
    return (
      <EmptyState
        title={fa ? "ابتدا سازمان فعال را انتخاب کنید." : "Choose an active organization first."}
      />
    );
  return (
    <section className="grid gap-4" dir={fa ? "rtl" : "ltr"}>
      <Card className="grid gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-brand text-white">
              <FileSpreadsheet size={22} />
            </span>
            <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {fa
                ? "ستون‌های کد کلاس، نام، سال تحصیلی و ظرفیت را وارد کنید. سال تحصیلی باید مانند ۱۴۰۵-۱۴۰۶ باشد."
                : "Use code, name, school year, and capacity columns. School years must be consecutive, such as 1405-1406."}
            </p>
          </div>
          <SpreadsheetTransferActions
            canImport={canImport}
            canExport={canExport}
            busy={busy}
            onImport={(file) => void pick(file)}
            onTemplate={() => void downloadTemplate()}
            onExport={() => void exportXlsx()}
          />
        </div>
        {fileIssues.length ? (
          <div
            role="alert"
            className="max-h-40 overflow-auto rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
          >
            <strong>{fa ? "فایل نیاز به اصلاح دارد:" : "Fix these workbook cells:"}</strong>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {fileIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>
      {preview ? (
        <Card className="grid gap-4 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <strong>
              {fa ? "کل" : "Total"}: {preview.total}
            </strong>
            <strong className="text-emerald-700 dark:text-emerald-400">
              {fa ? "معتبر" : "Valid"}: {preview.valid}
            </strong>
            <strong className="text-rose-700 dark:text-rose-400">
              {fa ? "خطا" : "Errors"}: {preview.invalid}
            </strong>
          </div>
          {preview.invalid ? (
            <div className="max-h-52 overflow-auto rounded-lg border border-rose-200 p-3 text-sm dark:border-rose-900">
              {preview.rows
                .filter((row) => row.errors.length)
                .map((row) => (
                  <p
                    key={row.row}
                    className="border-b border-rose-100 py-2 last:border-0 dark:border-rose-950"
                  >
                    {fa ? "ردیف" : "Row"} {row.row}: {row.errors.join(fa ? "، " : ", ")}
                  </p>
                ))}
            </div>
          ) : (
            <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
              {fa ? "همه ردیف‌ها آماده ثبت هستند." : "All rows are ready to import."}
            </p>
          )}
          {canImport ? (
            <div className="flex justify-end">
              <Button
                disabled={busy || preview.invalid > 0 || !preview.valid}
                loading={busy}
                onClick={() => void commit()}
              >
                <FileUp size={16} />
                {fa
                  ? `ثبت ${preview.valid.toLocaleString("fa-IR")} کلاس`
                  : `Import ${preview.valid} classes`}
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}
    </section>
  );
}
