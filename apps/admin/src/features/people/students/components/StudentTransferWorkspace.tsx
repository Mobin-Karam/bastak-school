import { useState } from "react";
import { api } from "../../../../shared/api/api";
import {
  defineSpreadsheet,
  downloadSpreadsheet,
  readSpreadsheet,
  spreadsheetIssues,
} from "../../../../shared/lib/spreadsheet-transfer";
import { Button, Card } from "../../../../shared/ui/ui";
import { SpreadsheetTransferActions } from "../../../../shared/ui/spreadsheet-transfer-actions";

type ImportRow = {
  firstName: string;
  lastName: string;
  nationalCode?: string;
  gradeId?: number;
  educationTypeId?: string;
  trackId?: string;
};
type ExportRow = ImportRow & { phoneNumber?: string; registrationStatus?: string };
type Preview = {
  total: number;
  valid: number;
  invalid: number;
  rows: Array<ImportRow & { row: number; errors: string[] }>;
};

const studentSheet = defineSpreadsheet<ImportRow>({
  sheetName: "Students",
  columns: [
    { key: "firstName", header: "نام", required: true },
    { key: "lastName", header: "نام خانوادگی", required: true },
    { key: "nationalCode", header: "کد ملی" },
    { key: "gradeId", header: "پایه", read: (value) => Number(value) || undefined },
    { key: "educationTypeId", header: "نوع آموزش" },
    { key: "trackId", header: "رشته" },
  ],
});
const exportSheet = defineSpreadsheet<ExportRow>({
  ...studentSheet,
  columns: [
    ...studentSheet.columns,
    { key: "phoneNumber", header: "شماره همراه" },
    { key: "registrationStatus", header: "وضعیت ثبت‌نام" },
  ],
});

export function StudentTransferWorkspace({
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
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");
  const [fileIssues, setFileIssues] = useState<string[]>([]);
  const ready = Boolean(organizationId);

  async function pick(file?: File) {
    if (!file || !ready) return;
    try {
      const parsed = await readSpreadsheet(file, studentSheet);
      setRows(parsed);
      setFileIssues([]);
      setPreview(
        await api.post<Preview>("/students/transfer/preview", { organizationId, rows: parsed }),
      );
      setMessage("");
    } catch (error) {
      setPreview(null);
      setRows([]);
      const issues = spreadsheetIssues(error);
      setFileIssues(
        issues.map(
          (issue) =>
            `برگه «${issue.sheet}» · ردیف ${issue.row ?? 1} · ستون «${issue.column ?? "نامشخص"}»`,
        ),
      );
      setMessage(
        issues.length ? "خانه‌های مشخص‌شده را اصلاح کنید." : "ساختار فایل Excel معتبر نیست.",
      );
    }
  }
  async function commit() {
    if (!ready || !rows.length) return;
    const result = await api.post<{ committed: boolean; count?: number; invalid?: number }>(
      "/students/transfer/commit",
      { organizationId, rows },
    );
    setMessage(
      result.committed
        ? `${result.count ?? 0} طلبه وارد شد.`
        : `فایل ${result.invalid ?? 0} ردیف نامعتبر دارد.`,
    );
    if (result.committed) onCompleted();
  }
  async function exportXlsx() {
    if (!ready) return;
    const data = await api.get<ExportRow[]>(
      `/students/transfer/export?organizationId=${encodeURIComponent(organizationId)}`,
    );
    await downloadSpreadsheet(exportSheet, data, "students.xlsx");
  }
  async function template() {
    await downloadSpreadsheet(
      studentSheet,
      [
        {
          firstName: "نام",
          lastName: "نام خانوادگی",
          nationalCode: "",
          gradeId: 7,
          educationTypeId: "general",
          trackId: "general",
        },
      ],
      "student-import-template.xlsx",
    );
  }

  return (
    <section className="grid gap-4" dir="rtl">
      <p className="text-sm leading-6 text-slate-500">
        ورود و خروجی فقط برای سازمان فعال انجام می‌شود. ورود، ابتدا اعتبارسنجی می‌شود و سپس در فهرست
        طلبه‌ها همگام خواهد شد.
      </p>
      {!ready ? (
        <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          ابتدا سازمان فعال را انتخاب کنید.
        </p>
      ) : null}
      <Card className="p-4">
        <div className="grid gap-3">
          <SpreadsheetTransferActions
            canImport={canImport}
            canExport={canExport}
            busy={!ready}
            onImport={(file) => void pick(file)}
            onTemplate={() => void template()}
            onExport={() => void exportXlsx()}
          />
          {canImport ? (
            <Button disabled={!preview || preview.invalid > 0} onClick={() => void commit()}>
              ثبت {preview?.valid ?? 0} ردیف معتبر
            </Button>
          ) : null}
        </div>
        {fileIssues.length ? (
          <div
            role="alert"
            className="mt-4 max-h-40 overflow-auto rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
          >
            <strong>فایل نیاز به اصلاح دارد:</strong>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {fileIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {preview ? (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div>کل: {preview.total}</div>
            <div className="text-emerald-700">معتبر: {preview.valid}</div>
            <div className="text-rose-700">خطا: {preview.invalid}</div>
          </div>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm" role="status">
            {message}
          </p>
        ) : null}
        {preview?.rows.some((row) => row.errors.length) ? (
          <div className="mt-4 max-h-64 overflow-auto text-xs">
            {preview.rows
              .filter((row) => row.errors.length)
              .map((row) => (
                <p key={row.row} className="border-b py-1">
                  ردیف {row.row}: {row.errors.join("، ")}
                </p>
              ))}
          </div>
        ) : null}
      </Card>
    </section>
  );
}
