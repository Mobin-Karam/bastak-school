import { CalendarClock, CircleHelp, Plus, RotateCcw } from "lucide-react";
import { AdminList } from "../../../shared/ui/admin-list";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { Badge, Button, Select } from "../../../shared/ui/ui";
import type { Quiz } from "../model/quiz.types";
import { useQuizCopy } from "../model/quiz-locale";

type Props = {
  quizzes: Quiz[];
  loading: boolean;
  error: boolean;
  selectedId: string;
  search: string;
  status: string;
  onNew: () => void;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onSelect: (id: string) => void;
  onRetry: () => void;
  onClear: () => void;
  canCreate: boolean;
};

export function QuizSidebar({
  quizzes,
  loading,
  error,
  selectedId,
  search,
  status,
  onNew,
  onSearch,
  onStatus,
  onSelect,
  onRetry,
  onClear,
  canCreate,
}: Props) {
  const copy = useQuizCopy();
  return (
    <AdminList
      label={copy.quizzes}
      description={copy.quizDescription}
      items={quizzes}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle={search || status !== "all" ? copy.noFilteredQuiz : copy.noQuiz}
      emptyAction={
        search || status !== "all" ? (
          <Button variant="ghost" onClick={onClear}>
            <RotateCcw size={15} />
            {copy.clearFilters}
          </Button>
        ) : canCreate ? (
          <Button onClick={onNew}>
            <Plus size={15} />
            {copy.firstQuiz}
          </Button>
        ) : undefined
      }
      toolbar={
        <CollectionToolbar
          search={search}
          onSearchChange={onSearch}
          placeholder={copy.searchQuizzes}
          onClear={search || status !== "all" ? onClear : undefined}
          filters={
            <Select
              aria-label={copy.statusFilter}
              className="h-8 min-w-28 border-0 bg-transparent text-[11px]"
              value={status}
              onChange={(event) => onStatus(event.target.value)}
            >
              <option value="all">{copy.allStatuses}</option>
              <option value="active">{copy.active}</option>
              <option value="inactive">{copy.inactive}</option>
            </Select>
          }
          actions={
            canCreate ? (
              <Button size="sm" onClick={onNew}>
                <Plus size={15} />
                {copy.newQuiz}
              </Button>
            ) : undefined
          }
        />
      }
      actions={
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Badge tone="blue">
            {quizzes.length.toLocaleString(copy.numberLocale)} {copy.results}
          </Badge>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {quizzes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`grid min-h-36 content-between gap-3 rounded-lg border p-3 text-start shadow-[var(--shadow-surface)] transition focus:outline-none focus:ring-2 focus:ring-brand ${selectedId === item.id ? "border-brand bg-brand/5" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] hover:border-brand/50 hover:bg-[rgb(var(--surface-muted))]"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                <CircleHelp size={17} />
              </span>
              <Badge tone={item.active ? "green" : "neutral"}>
                {item.active ? copy.active : copy.inactive}
              </Badge>
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-sm">{item.title}</strong>
              <p className="mt-1 truncate text-xs text-slate-500">
                {item.subject || copy.noSubject}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>
                {item.questions?.length.toLocaleString(copy.numberLocale) || "0"} {copy.questions}
              </span>
              <span>
                {item.durationMinutes.toLocaleString(copy.numberLocale)} {copy.minutes}
              </span>
              {item.openAt ? (
                <span className="flex items-center gap-1">
                  <CalendarClock size={12} />
                  {copy.scheduled}
                </span>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </AdminList>
  );
}
