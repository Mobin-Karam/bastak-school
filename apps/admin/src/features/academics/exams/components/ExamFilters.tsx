import { CheckCircle2, FilePenLine, SlidersHorizontal, Trash2 } from "lucide-react";
import type { Exam } from "../../../shared/types/domain";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { Badge, Button, Card, Select } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { ExamFilterStatus, ExamVisibilityFilter } from "../model/exam.types";
import { examsCopy } from "../exams-locale";

export function ExamFilters({
  exams,
  pendingRetryCount,
  search,
  status,
  visibility,
  selectedCount,
  onSearchChange,
  onStatusChange,
  onVisibilityChange,
  onClear,
  onBulk,
}: {
  exams: Exam[];
  pendingRetryCount: number;
  search: string;
  status: ExamFilterStatus;
  visibility: ExamVisibilityFilter;
  selectedCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ExamFilterStatus) => void;
  onVisibilityChange: (value: ExamVisibilityFilter) => void;
  onClear: () => void;
  onBulk: (action: "publish" | "draft" | "delete") => void;
}) {
  const { language } = useLocale();
  const copy = examsCopy(language);
  const hasFilters = Boolean(search || status !== "all" || visibility !== "all");

  const publishedCount = exams.filter((exam) => exam.published).length;
  const draftCount = exams.length - publishedCount;
  const withoutQuestionsCount = exams.filter(
    (exam) => exam.published && !exam.delivery?.questionCount,
  ).length;

  return (
    <Card className="sticky top-14 z-20 overflow-hidden p-0 backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--surface-card))]/95">
      <div className="border-b border-[rgb(var(--border-subtle))] p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[rgb(var(--surface-muted))] text-slate-600 dark:text-slate-300">
              <SlidersHorizontal size={17} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{copy.filters}</p>
              <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
                {copy.filtersHint}
              </p>
            </div>
          </div>
        </div>

        <CollectionToolbar
          search={search}
          onSearchChange={onSearchChange}
          placeholder={copy.searchExams}
          onClear={hasFilters ? onClear : undefined}
          filters={
            <>
              <Select
                className="h-8 min-w-36 border-0 bg-transparent px-2 text-xs shadow-none"
                aria-label={copy.examStatusFilter}
                value={status}
                onChange={(event) => onStatusChange(event.target.value as ExamFilterStatus)}
              >
                <option value="all">{copy.allStatuses}</option>
                <option value="upcoming">{copy.upcoming}</option>
                <option value="active">{copy.active}</option>
                <option value="completed">{copy.completed}</option>
                <option value="cancelled">{copy.cancelled}</option>
              </Select>
              <Select
                className="h-8 min-w-36 border-0 bg-transparent px-2 text-xs shadow-none"
                aria-label={copy.examVisibilityFilter}
                value={visibility}
                onChange={(event) => onVisibilityChange(event.target.value as ExamVisibilityFilter)}
              >
                <option value="all">{copy.allVisibility}</option>
                <option value="published">{copy.published}</option>
                <option value="draft">{copy.draft}</option>
              </Select>
            </>
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-xs sm:px-4">
        <Badge tone="blue">{copy.total(exams.length)}</Badge>
        <Badge tone="green">{copy.publishedCount(publishedCount)}</Badge>
        <Badge tone="amber">{copy.draftCount(draftCount)}</Badge>

        {withoutQuestionsCount ? (
          <Badge tone="red">{copy.withoutQuestions(withoutQuestionsCount)}</Badge>
        ) : null}

        {pendingRetryCount ? (
          <Badge tone="amber">{copy.pendingRetries(pendingRetryCount)}</Badge>
        ) : null}
      </div>

      {selectedCount ? (
        <div className="border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-900 px-2 text-xs text-white dark:bg-slate-100 dark:text-slate-900">
                {selectedCount}
              </span>
              {copy.selectedExams(selectedCount)}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="h-8 gap-1.5 px-2.5 text-xs"
                variant="soft"
                onClick={() => onBulk("publish")}
              >
                <CheckCircle2 size={14} />
                {copy.publish}
              </Button>

              <Button
                className="h-8 gap-1.5 px-2.5 text-xs"
                variant="soft"
                onClick={() => onBulk("draft")}
              >
                <FilePenLine size={14} />
                {copy.makeDraft}
              </Button>

              <Button
                className="h-8 gap-1.5 px-2.5 text-xs"
                variant="danger"
                onClick={() => onBulk("delete")}
              >
                <Trash2 size={14} />
                {copy.delete}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
