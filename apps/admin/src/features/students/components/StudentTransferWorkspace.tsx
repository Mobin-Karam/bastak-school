import { type ChangeEvent, useState } from "react";
import { api } from "../../../shared/api/api";
import {
  defineSpreadsheet,
  downloadSpreadsheet,
  readSpreadsheet,
} from "../../../shared/lib/spreadsheet-transfer";
import { Button, Card } from "../../../shared/ui/ui";

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
  const ready = Boolean(organizationId);

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !ready) return;
    try {
      const parsed = await readSpreadsheet(file, studentSheet);
      setRows(parsed);
      setPreview(
        await api.post<Preview>("/students/transfer/preview", { organizationId, rows: parsed }),
      );
      setMessage("");
    } catch {
      setPreview(null);
      setRows([]);
      setMessage("ساختار فایل Excel معتبر نیست.");
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
        <div className="flex flex-wrap gap-2">
          {canImport ? (
            <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[rgb(var(--border-subtle))] px-3 text-sm font-bold">
              <input
                className="hidden"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={!ready}
                onChange={(event) => void pick(event)}
              />
              انتخاب Excel
            </label>
          ) : null}
          {canImport ? (
            <Button variant="ghost" onClick={() => void template()}>
              نمونه Excel
            </Button>
          ) : null}
          {canExport ? (
            <Button variant="soft" disabled={!ready} onClick={() => void exportXlsx()}>
              خروجی Excel
            </Button>
          ) : null}
          {canImport ? (
            <Button disabled={!preview || preview.invalid > 0} onClick={() => void commit()}>
              ثبت {preview?.valid ?? 0} ردیف معتبر
            </Button>
          ) : null}
        </div>
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
