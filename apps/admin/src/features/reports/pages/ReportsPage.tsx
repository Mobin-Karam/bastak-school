import { useQuery } from "@tanstack/react-query";
import { CalendarRange, LayoutGrid, List, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { StudentPicker } from "../../../shared/ui/StudentPicker";
import { DatePicker } from "../../../shared/ui/date-picker";
import { useLocale } from "../../../shared/ui/locale";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import { Button, Card, EmptyState, Select } from "../../../shared/ui/ui";
import { useStudentSelection } from "../../../shared/hooks/useStudentSelection";
import { addDays, todayIso, normalizePersianText } from "../../../shared/lib/utils";
import { getReports } from "../api/reports.api";
import { ReportCard } from "../components/ReportCard";
import { ReportCompactList } from "../components/ReportCompactList";
import { ReportSummary } from "../components/ReportSummary";
import { reportDate, reportText, summarizeReports } from "../report-utils";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { reportCopy } from "../model/report-copy";

type ViewMode = "cards" | "compact";
type SortMode = "newest" | "oldest";

const presets = [7, 14, 30] as const;

function validIsoDate(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function ReportsPage() {
  const students = useStudentSelection();
  const locale = useLocale();
  const copy = reportCopy(locale.language);
  const [params, setParams] = useSearchParams();
  const [defaultRange] = useState(() => ({ from: addDays(todayIso(), -6), to: todayIso() }));
  const from = validIsoDate(params.get("from")) ? params.get("from")! : defaultRange.from;
  const to = validIsoDate(params.get("to")) ? params.get("to")! : defaultRange.to;
  const search = params.get("q") || "";
  const sort: SortMode = params.get("sort") === "oldest" ? "oldest" : "newest";
  const view: ViewMode = params.get("view") === "compact" ? "compact" : "cards";

  function setReportParams(
    next: Partial<{ from: string; to: string; q: string; sort: SortMode; view: ViewMode }>,
  ) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (next.from !== undefined) updated.set("from", next.from);
        if (next.to !== undefined) updated.set("to", next.to);
        if (next.q !== undefined) next.q ? updated.set("q", next.q) : updated.delete("q");
        if (next.sort !== undefined)
          next.sort === "newest" ? updated.delete("sort") : updated.set("sort", next.sort);
        if (next.view !== undefined)
          next.view === "cards" ? updated.delete("view") : updated.set("view", next.view);
        return updated;
      },
      { replace: true },
    );
  }

  const reports = useQuery({
    queryKey: ["reports", students.studentId, from, to],
    enabled: !!students.studentId,
    queryFn: () => getReports(students.studentId, from, to),
  });
  const visibleReports = useMemo(() => {
    const needle = normalizePersianText(search);
    return (reports.data ?? [])
      .filter((report) => !needle || normalizePersianText(reportText(report)).includes(needle))
      .slice()
      .sort((a, b) => {
        const left = reportDate(a);
        const right = reportDate(b);
        return sort === "newest" ? right.localeCompare(left) : left.localeCompare(right);
      });
  }, [reports.data, search, sort]);
  const summary = useMemo(() => summarizeReports(reports.data ?? []), [reports.data]);

  function applyPreset(days: number) {
    const end = todayIso();
    setReportParams({ to: end, from: addDays(end, -(days - 1)) });
  }

  return (
    <div className="grid gap-4 sm:gap-5">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <Card className="sticky top-14 z-10 shadow-[var(--shadow-surface)]">
        <div className="grid gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(160px,0.7fr)_minmax(160px,0.7fr)]">
            <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
              <span>{copy.student}</span>
              <StudentPicker
                students={students.students}
                value={students.studentId}
                onChange={students.selectStudent}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
              <span>{copy.from}</span>
              <DatePicker
                value={from}
                max={to}
                onChange={(next) => setReportParams({ from: next })}
              />
            </label>
            <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
              <span>{copy.to}</span>
              <DatePicker
                value={to}
                min={from}
                onChange={(next) => setReportParams({ to: next })}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-[rgb(var(--border-subtle))] pt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <CalendarRange size={15} />
              {copy.quickRange}
            </span>
            {presets.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => applyPreset(days)}
                className="min-h-8 rounded-md border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {copy.days(days)}
              </button>
            ))}
            <span className="ms-auto text-xs text-slate-400">
              {copy.dateRange(locale.formatDate(from), locale.formatDate(to))}
            </span>
          </div>
        </div>
      </Card>

      {!students.studentId ? (
        <Card>
          <EmptyState title={copy.selectStudent} />
        </Card>
      ) : reports.isLoading ? (
        <Card>
          <div className="grid gap-3" aria-label={copy.loading}>
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-lg bg-[rgb(var(--surface-muted))]"
              />
            ))}
          </div>
        </Card>
      ) : reports.isError ? (
        <Card>
          <div className="flex min-h-44 flex-col items-center justify-center gap-3 text-center">
            <div>
              <strong className="text-sm text-slate-800">{copy.loadFailed}</strong>
              <p className="mt-1 text-xs text-slate-500">{copy.loadFailedDescription}</p>
            </div>
            <Button variant="soft" onClick={() => void reports.refetch()}>
              <RefreshCw size={16} />
              {copy.retry}
            </Button>
          </div>
        </Card>
      ) : reports.data?.length ? (
        <>
          <ReportSummary summary={summary} />

          <Card>
            <CollectionToolbar
              search={search}
              onSearchChange={(value) => setReportParams({ q: value })}
              placeholder={copy.search}
              resultLabel={copy.results(visibleReports.length, reports.data.length)}
              filters={
                <Select
                  className="h-8 min-w-28 border-0 bg-transparent px-2 text-xs shadow-none"
                  aria-label={copy.order}
                  value={sort}
                  onChange={(event) => setReportParams({ sort: event.target.value as SortMode })}
                >
                  <option value="newest">{copy.newest}</option>
                  <option value="oldest">{copy.oldest}</option>
                </Select>
              }
              actions={
                <SegmentedControl
                  ariaLabel={copy.view}
                  value={view}
                  onValueChange={(next) => setReportParams({ view: next })}
                  options={[
                    {
                      value: "cards",
                      ariaLabel: copy.cards,
                      title: copy.cards,
                      label: <LayoutGrid size={15} />,
                    },
                    {
                      value: "compact",
                      ariaLabel: copy.compact,
                      title: copy.compact,
                      label: <List size={15} />,
                    },
                  ]}
                />
              }
            />
            {visibleReports.length ? (
              view === "cards" ? (
                <div className="grid gap-3">
                  {visibleReports.map((report, index) => (
                    <ReportCard
                      key={String(report.id ?? `${reportDate(report)}-${index}`)}
                      report={report}
                      formatDate={locale.formatDate}
                    />
                  ))}
                </div>
              ) : (
                <ReportCompactList reports={visibleReports} formatDate={locale.formatDate} />
              )
            ) : (
              <EmptyState title={copy.noMatches} />
            )}
          </Card>
        </>
      ) : (
        <Card>
          <EmptyState title={copy.noRange(locale.formatDate(from), locale.formatDate(to))} />
        </Card>
      )}
    </div>
  );
}
