import { ArrowUpLeft, ClipboardCheck, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, EmptyState } from "../../../shared/ui/ui";
import { fa } from "../../../shared/lib/utils";
import { useLocale } from "../../../shared/ui/locale";
import { dashboardCopy } from "../model/dashboard-copy";
import type { DashboardRecentReport } from "../model/dashboard.types";

function reportStudentId(report: DashboardRecentReport) {
  return report.studentId || report.student_id || "";
}

function reportStudentName(report: DashboardRecentReport, fallback: string) {
  return report.studentName || report.student_name || fallback;
}

function reportDate(report: DashboardRecentReport) {
  return (
    report.updatedAt ||
    report.updated_at ||
    report.createdAt ||
    report.created_at ||
    report.planDate ||
    report.plan_date
  );
}

export function RecentReportsCard({ reports }: { reports: DashboardRecentReport[] }) {
  const { formatDateTime, formatDate, language } = useLocale();
  const copy = dashboardCopy[language];

  return (
    <Card className="p-0 dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white">{copy.recentReports}</h3>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {copy.reportsDescription}
          </p>
        </div>
        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline"
        >
          {copy.allReports}
          <ArrowUpLeft size={14} className="rtl:-scale-x-100" />
        </Link>
      </header>

      {reports.length ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {reports.slice(0, 8).map((report) => {
            const studentId = reportStudentId(report);
            const date = reportDate(report);
            const totalAnswered =
              Number(report.correct || 0) + Number(report.wrong || 0) + Number(report.blank || 0);
            const accuracy = totalAnswered
              ? Math.round((Number(report.correct || 0) / totalAnswered) * 100)
              : null;
            return (
              <article key={report.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <ClipboardCheck size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <strong className="truncate text-sm text-slate-800 dark:text-slate-100">
                      {reportStudentName(report, copy.student)}
                    </strong>
                    {report.planDate || report.plan_date ? (
                      <span className="text-[10px] text-slate-400">
                        {formatDate(report.planDate || report.plan_date)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                    {report.studyHours || report.study_hours ? (
                      <span>
                        {copy.study} {fa(report.studyHours || report.study_hours)} {copy.hours}
                      </span>
                    ) : null}
                    {Number(report.tests || 0) > 0 ? (
                      <span>
                        {fa(report.tests)} {copy.tests}
                      </span>
                    ) : null}
                    {accuracy != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Target size={10} /> {copy.accuracy} {fa(accuracy)}٪
                      </span>
                    ) : null}
                    {date ? (
                      <span>{date.includes("T") ? formatDateTime(date) : formatDate(date)}</span>
                    ) : null}
                  </div>
                </div>
                {studentId ? (
                  <Link
                    to={`/admin/reports?studentId=${encodeURIComponent(studentId)}`}
                    className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-brand/30 hover:text-brand dark:border-slate-700 dark:text-slate-300"
                  >
                    {copy.view}
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <EmptyState title={copy.noReports} />
        </div>
      )}
    </Card>
  );
}
