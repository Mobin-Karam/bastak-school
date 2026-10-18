import { AlertTriangle, Target } from "lucide-react";
import type { ReportRow } from "../api/reports.api";
import { reportAccuracy, reportNumber } from "../report-utils";
import { AdminDataTable } from "../../../shared/ui/admin-data-table";
import { useLocale } from "../../../shared/ui/locale";
import { reportCopy } from "../model/report-copy";

export function ReportCompactList({
  reports,
  formatDate,
}: {
  reports: ReportRow[];
  formatDate: (value?: string | Date) => string;
}) {
  const locale = useLocale();
  const copy = reportCopy(locale.language);
  const number = (value: number) => value.toLocaleString(locale.profile.locale);
  return (
    <AdminDataTable
      rows={reports}
      rowId={(row) => String(row.id ?? `${row.plan_date ?? row.planDate}-${row.created_at ?? ""}`)}
      label={copy.daily}
      mobileCard={(row) => {
        const date = row.plan_date ?? row.planDate;
        const accuracy = reportAccuracy(row);
        return (
          <div className="grid gap-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <strong>{date ? formatDate(String(date)) : "—"}</strong>
              <span className="text-xs text-slate-500">
                {copy.accuracy}: {accuracy === null ? "—" : `${number(accuracy)}%`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <Metric
                label={copy.study}
                value={`${number(reportNumber(row.study_hours ?? row.studyHours))} ${copy.hours}`}
              />
              <Metric label={copy.tests} value={number(reportNumber(row.tests))} />
              <Metric label={copy.focus} value={`${number(reportNumber(row.focus))}/10`} />
            </div>
            {row.problem || row.tomorrow ? (
              <div className="grid gap-1 border-t border-[rgb(var(--border-subtle))] pt-2 text-xs">
                {row.problem ? (
                  <span className="text-rose-700">
                    {copy.problem}: {String(row.problem)}
                  </span>
                ) : null}
                {row.tomorrow ? (
                  <span className="text-indigo-700">
                    {copy.tomorrow}: {String(row.tomorrow)}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      }}
      columns={[
        {
          id: "date",
          header: copy.noDate,
          cell: (row) => {
            const date = row.plan_date ?? row.planDate;
            return (
              <span className="whitespace-nowrap font-semibold">
                {date ? formatDate(String(date)) : "—"}
              </span>
            );
          },
        },
        {
          id: "study",
          header: copy.study,
          cell: (row) => `${number(reportNumber(row.study_hours ?? row.studyHours))} ${copy.hours}`,
        },
        { id: "tests", header: copy.tests, cell: (row) => number(reportNumber(row.tests)) },
        {
          id: "accuracy",
          header: copy.accuracy,
          cell: (row) => {
            const accuracy = reportAccuracy(row);
            return accuracy === null ? "—" : `${number(accuracy)}%`;
          },
        },
        { id: "focus", header: copy.focus, cell: (row) => `${number(reportNumber(row.focus))}/10` },
        {
          id: "motivation",
          header: copy.motivation,
          cell: (row) => `${number(reportNumber(row.motivation))}/10`,
        },
        {
          id: "fatigue",
          header: copy.fatigue,
          cell: (row) => `${number(reportNumber(row.fatigue))}/10`,
        },
        {
          id: "note",
          header: copy.note,
          className: "max-w-[260px]",
          cell: (row) => (
            <div className="flex min-w-0 gap-2">
              {row.problem ? (
                <span
                  title={String(row.problem)}
                  className="inline-flex min-w-0 items-center gap-1 text-rose-700"
                >
                  <AlertTriangle size={14} className="shrink-0" />
                  <span className="truncate">{String(row.problem)}</span>
                </span>
              ) : null}
              {row.tomorrow ? (
                <span
                  title={String(row.tomorrow)}
                  className="inline-flex min-w-0 items-center gap-1 text-indigo-700"
                >
                  <Target size={14} className="shrink-0" />
                  <span className="truncate">{String(row.tomorrow)}</span>
                </span>
              ) : null}
              {!row.problem && !row.tomorrow ? "—" : null}
            </div>
          ),
        },
      ]}
    />
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-[rgb(var(--surface-muted))] px-2 py-2">
      <b className="block text-slate-800 dark:text-slate-100">{value}</b>
      <span className="mt-1 block text-slate-500">{label}</span>
    </span>
  );
}
