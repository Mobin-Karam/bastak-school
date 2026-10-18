import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CircleGauge,
  ListChecks,
  Target,
  XCircle,
} from "lucide-react";
import { Badge } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { ReportRow } from "../api/reports.api";
import { reportCopy } from "../model/report-copy";
import { reportAccuracy, reportNumber } from "../report-utils";

function Meter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "focus" | "motivation" | "fatigue";
}) {
  const safe = Math.max(0, Math.min(10, value));
  const bar =
    tone === "fatigue"
      ? "bg-amber-500"
      : tone === "motivation"
        ? "bg-emerald-500"
        : "bg-indigo-500";
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">{label}</span>
        <strong className="text-ink">{safe.toLocaleString(useLocale().profile.locale)}/10</strong>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${safe * 10}%` }} />
      </div>
    </div>
  );
}

export function ReportCard({
  report: row,
  formatDate,
}: {
  report: ReportRow;
  formatDate: (value?: string | Date) => string;
}) {
  const locale = useLocale();
  const copy = reportCopy(locale.language);
  const number = (value: number) => value.toLocaleString(locale.profile.locale);
  const date = row.plan_date ?? row.planDate;
  const accuracy = reportAccuracy(row);
  const study = reportNumber(row.study_hours ?? row.studyHours);
  const tests = reportNumber(row.tests);
  const correct = reportNumber(row.correct);
  const wrong = reportNumber(row.wrong);
  const focus = reportNumber(row.focus);
  const fatigue = reportNumber(row.fatigue);
  const motivation = reportNumber(row.motivation);

  return (
    <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-white transition hover:border-slate-300">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <p className="text-xs font-semibold text-slate-400">{copy.daily}</p>
          <strong className="mt-1 block text-sm text-ink">
            {date ? formatDate(String(date)) : copy.noDate}
          </strong>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="blue">
            {copy.focus} {number(focus)}/10
          </Badge>
          <Badge tone="green">
            {copy.motivation} {number(motivation)}/10
          </Badge>
          <Badge tone="amber">
            {copy.fatigue} {number(fatigue)}/10
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 p-2.5">
          <BookOpen size={16} className="text-slate-400" />
          <span className="text-xs text-slate-500">{copy.study}</span>
          <strong className="ms-auto text-sm">
            {number(study)} {copy.hours}
          </strong>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 p-2.5">
          <ListChecks size={16} className="text-slate-400" />
          <span className="text-xs text-slate-500">{copy.tests}</span>
          <strong className="ms-auto text-sm">{number(tests)}</strong>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50/70 p-2.5">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span className="text-xs text-emerald-700">{copy.correct}</span>
          <strong className="ms-auto text-sm text-emerald-800">{number(correct)}</strong>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-rose-50/70 p-2.5">
          <XCircle size={16} className="text-rose-500" />
          <span className="text-xs text-rose-700">{copy.incorrect}</span>
          <strong className="ms-auto text-sm text-rose-800">{number(wrong)}</strong>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)]">
        <div className="grid gap-2.5 rounded-xl border border-slate-100 p-3">
          <Meter label={copy.focus} value={focus} tone="focus" />
          <Meter label={copy.motivation} value={motivation} tone="motivation" />
          <Meter label={copy.fatigue} value={fatigue} tone="fatigue" />
        </div>
        <div className="grid content-start gap-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3">
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <CircleGauge size={16} />
              {copy.accuracy}
            </span>
            <strong className="text-lg">{accuracy === null ? "-" : `${number(accuracy)}%`}</strong>
          </div>
          {row.problem ? (
            <p className="flex gap-2 rounded-xl bg-rose-50 p-3 text-sm leading-6 text-rose-800">
              <AlertTriangle className="mt-1 shrink-0" size={16} />
              <span>
                <strong>{copy.problem}:</strong> {String(row.problem)}
              </span>
            </p>
          ) : null}
          {row.tomorrow ? (
            <p className="flex gap-2 rounded-xl bg-indigo-50 p-3 text-sm leading-6 text-indigo-800">
              <Target className="mt-1 shrink-0" size={16} />
              <span>
                <strong>{copy.tomorrow}:</strong> {String(row.tomorrow)}
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
