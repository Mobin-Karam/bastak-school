import { ChangeEvent, useState } from "react";
import { useAuth } from "../../auth";
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

const studentExportSheet = defineSpreadsheet<ExportRow>({
  ...studentSheet,
  columns: [
    ...studentSheet.columns,
    { key: "phoneNumber", header: "شماره همراه" },
    { key: "registrationStatus", header: "وضعیت ثبت‌نام" },
  ],
});

export function StudentTransferPage() {
  const auth = useAuth();
  const organizationId =
    auth.context?.activeOrganization?.id ?? auth.context?.memberships?.[0]?.id ?? "";
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [message, setMessage] = useState("");

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !organizationId) return;
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
    if (!organizationId || !rows.length) return;
    const result = await api.post<{ committed: boolean; count?: number; invalid?: number }>(
      "/students/transfer/commit",
      { organizationId, rows },
    );
    setMessage(
      result.committed
        ? `${result.count ?? 0} طلبه وارد شد.`
        : `فایل ${result.invalid ?? 0} ردیف نامعتبر دارد.`,
    );
  }

  async function exportXlsx() {
    if (!organizationId) return;
    const data = await api.get<ExportRow[]>(
      `/students/transfer/export?organizationId=${encodeURIComponent(organizationId)}`,
    );
    await downloadSpreadsheet(studentExportSheet, data, "students.xlsx");
  }

  async function downloadTemplate() {
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
    <section className="space-y-4" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-ink">ورود و خروجی Excel طلبه‌ها</h1>
        <p className="text-sm text-slate-500">
          ستون‌ها: نام، نام خانوادگی، کد ملی، پایه، نوع آموزش، رشته. قبل از ورود نهایی فایل
          اعتبارسنجی می‌شود.
        </p>
      </div>
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-[rgb(var(--border-subtle))] px-3 text-sm font-bold">
            <input
              className="hidden"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => void pick(event)}
            />
            انتخاب Excel
          </label>
          <Button variant="ghost" onClick={() => void downloadTemplate()}>
            نمونه Excel
          </Button>
          <Button variant="soft" onClick={() => void exportXlsx()} disabled={!organizationId}>
            خروجی Excel
          </Button>
          <Button onClick={() => void commit()} disabled={!preview || preview.invalid > 0}>
            ثبت {preview?.valid ?? 0} ردیف معتبر
          </Button>
        </div>
        {preview ? (
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>کل: {preview.total}</div>
            <div className="text-emerald-700">معتبر: {preview.valid}</div>
            <div className="text-rose-700">خطا: {preview.invalid}</div>
          </div>
        ) : null}
        {message ? <p className="mt-3 text-sm">{message}</p> : null}
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
