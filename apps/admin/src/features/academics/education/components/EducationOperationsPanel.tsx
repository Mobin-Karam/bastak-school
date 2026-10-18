import type { UseQueryResult } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { DatePicker } from "../../../shared/ui/date-picker";
import { ManagementStat } from "../../../shared/ui/management-workspace";
import { Button, Card } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { EducationOperationsOverview } from "../api/education-catalog.api";
import type { EducationOperationsFilters } from "../model/education-operations";
import { educationCopy } from "../model/education-copy";

export function EducationOperationsPanel({
  filters,
  onFiltersChange,
  operations,
  onExport,
}: {
  filters: EducationOperationsFilters;
  onFiltersChange: (filters: EducationOperationsFilters) => void;
  operations: Pick<
    UseQueryResult<EducationOperationsOverview>,
    "data" | "isError" | "isLoading" | "refetch"
  >;
  onExport: (overview: EducationOperationsOverview) => void;
}) {
  const locale = useLocale();
  const copy = educationCopy(locale.language);
  const clearFilters = () => onFiltersChange({ periodFrom: "", periodTo: "", cohortGrade: "" });
  const hasFilters = Boolean(filters.periodFrom || filters.periodTo || filters.cohortGrade);

  return (
    <Card className="grid gap-3 p-3" aria-labelledby="education-operations-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="education-operations-title" className="text-sm font-black text-ink">
            {copy.operations}
          </h2>
          <p className="mt-1 text-xs text-slate-500">{copy.operationsDescription}</p>
        </div>
        <Button
          variant="soft"
          size="sm"
          disabled={!operations.data}
          onClick={() => operations.data && onExport(operations.data)}
          title={copy.exportOperations}
        >
          <Download size={14} aria-hidden="true" />
          CSV
        </Button>
      </div>
      <div
        className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-900/60"
        aria-label={copy.operationsFilters}
      >
        <label className="grid w-40 gap-1 text-xs text-slate-600 dark:text-slate-300">
          <span>{copy.from}</span>
          <DatePicker
            value={filters.periodFrom}
            max={filters.periodTo}
            onChange={(periodFrom) => onFiltersChange({ ...filters, periodFrom })}
          />
        </label>
        <label className="grid w-40 gap-1 text-xs text-slate-600 dark:text-slate-300">
          <span>{copy.to}</span>
          <DatePicker
            value={filters.periodTo}
            min={filters.periodFrom}
            onChange={(periodTo) => onFiltersChange({ ...filters, periodTo })}
          />
        </label>
        <label className="grid w-32 gap-1 text-xs text-slate-600 dark:text-slate-300">
          <span>{copy.grade}</span>
          <select
            aria-label={copy.grade}
            className="h-11 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-950"
            value={filters.cohortGrade}
            onChange={(event) => onFiltersChange({ ...filters, cohortGrade: event.target.value })}
          >
            <option value="">{copy.all}</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((grade) => (
              <option key={grade} value={grade}>
                {copy.gradePrefix} {grade.toLocaleString(locale.profile.locale)}
              </option>
            ))}
          </select>
        </label>
        <Button variant="ghost" size="sm" disabled={!hasFilters} onClick={clearFilters}>
          {copy.clearFilters}
        </Button>
      </div>
      {Boolean(filters.periodFrom) !== Boolean(filters.periodTo) ? (
        <p role="status" className="text-xs text-amber-700">
          {copy.partialRange}
        </p>
      ) : null}
      {operations.isLoading ? (
        <p role="status" className="text-sm text-slate-500">
          {copy.calculating}
        </p>
      ) : null}
      {operations.isError ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-red-700">
          <span>{copy.operationsFailed}</span>
          <Button variant="soft" size="sm" onClick={() => void operations.refetch()}>
            <RefreshCw size={14} aria-hidden="true" />
            {locale.language === "fa" ? "تلاش دوباره" : "Try again"}
          </Button>
        </div>
      ) : null}
      {operations.data ? (
        <>
          <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label={copy.coverage}>
            <ManagementStat
              label={copy.completeProfile}
              value={operations.data.students.complete}
              tone="success"
            />
            <ManagementStat
              label={copy.withoutPlan}
              value={operations.data.coverage.withoutPlan}
              tone="muted"
            />
            <ManagementStat
              label={copy.withoutResources}
              value={operations.data.coverage.withoutResources}
              tone="muted"
            />
            <ManagementStat
              label={copy.averageExam}
              value={operations.data.trends.averageExamPercentage ?? 0}
              tone="brand"
            />
          </section>
          <details className="group rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
            <summary className="cursor-pointer text-sm font-bold text-ink">{copy.details}</summary>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="grid gap-1.5">
                {operations.data.distribution.map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-xs dark:bg-slate-900"
                  >
                    <span>{item.label}</span>
                    <strong>{item.count.toLocaleString(locale.profile.locale)}</strong>
                  </div>
                ))}
              </div>
              <div className="grid gap-2">
                {Object.entries(operations.data.remediation).map(([key, rows]) => (
                  <div key={key} className="rounded-md bg-slate-50 p-2 dark:bg-slate-900">
                    <h3 className="text-xs font-bold">
                      {rows[0]?.reason || remediationLabel(key, copy)}
                    </h3>
                    {rows.length ? (
                      rows.slice(0, 3).map((student) => (
                        <Link
                          key={student.id}
                          to={`/admin/students?studentId=${encodeURIComponent(student.id)}`}
                          className="mt-1 flex justify-between rounded px-1 text-xs hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          <span>{student.name}</span>
                          <span className="text-slate-500">
                            {copy.gradePrefix}{" "}
                            {student.grade?.toLocaleString(locale.profile.locale) || "—"}
                          </span>
                        </Link>
                      ))
                    ) : (
                      <p className="mt-1 text-xs text-emerald-700">{copy.noItems}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </details>
        </>
      ) : null}
    </Card>
  );
}

function remediationLabel(key: string, copy: ReturnType<typeof educationCopy>) {
  const labels: Record<string, string> = {
    incompleteProfiles: copy.completeProfile,
    withoutPlan: copy.withoutPlan,
    withoutResources: copy.withoutResources,
    withoutExam: copy.noQuestions,
    withoutReport: copy.noItems,
  };
  return labels[key] || key;
}
