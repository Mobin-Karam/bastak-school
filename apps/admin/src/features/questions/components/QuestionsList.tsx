import { CheckCircle2, Copy, Pencil, Trash2 } from "lucide-react";
import { AdminList } from "../../../shared/ui/admin-list";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { Button } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { QuestionView } from "../model/question-model";
import { questionNumber } from "../model/question-model";
import { questionsCopy } from "../questions-locale";

type Props = {
  examId: string;
  items: QuestionView[];
  total: number;
  loading: boolean;
  error: boolean;
  search: string;
  setSearch: (value: string) => void;
  selected: string[];
  setSelected: (value: string[]) => void;
  bulkBusy: boolean;
  onBulkDelete: () => void;
  onCopy: (question: QuestionView, index: number) => void;
  onEdit: (question: QuestionView, index: number) => void;
  onDelete: (question: QuestionView) => void;
  onRetry: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function QuestionsList(props: Props) {
  const { language } = useLocale();
  const copy = questionsCopy(language);
  const {
    examId,
    items,
    total,
    loading,
    error,
    search,
    setSearch,
    selected,
    setSelected,
    bulkBusy,
    onBulkDelete,
    onCopy,
    onEdit,
    onDelete,
    onRetry,
    canCreate,
    canUpdate,
    canDelete,
  } = props;
  const visibleIds = items.flatMap((item) => (item.id ? [item.id] : []));
  const allSelected = Boolean(visibleIds.length) && visibleIds.every((id) => selected.includes(id));
  return (
    <AdminList
      label={copy.title}
      description={copy.shownQuestions(items.length, total)}
      items={items}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle={examId ? copy.noQuestions : copy.selectExamFirst}
      toolbar={examId ? <SearchBox copy={copy} search={search} setSearch={setSearch} /> : null}
      actions={
        canDelete && items.length ? (
          <SelectionActions
            allSelected={allSelected}
            selected={selected}
            visibleIds={visibleIds}
            setSelected={setSelected}
            bulkBusy={bulkBusy}
            onBulkDelete={onBulkDelete}
            copy={copy}
          />
        ) : null
      }
    >
      <div className="grid min-h-0 gap-3 xl:grid-cols-2">
        {items.map((question, index) => (
          <QuestionCard
            key={question.id || index}
            question={question}
            index={index}
            selected={selected}
            setSelected={setSelected}
            canCreate={canCreate}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onCopy={onCopy}
            onEdit={onEdit}
            onDelete={onDelete}
            copy={copy}
          />
        ))}
      </div>
    </AdminList>
  );
}

function SearchBox({
  search,
  setSearch,
  copy,
}: {
  search: string;
  setSearch: (value: string) => void;
  copy: ReturnType<typeof questionsCopy>;
}) {
  return (
    <CollectionToolbar
      search={search}
      onSearchChange={setSearch}
      placeholder={copy.searchQuestions}
      onClear={search ? () => setSearch("") : undefined}
    />
  );
}

function SelectionActions({
  allSelected,
  selected,
  visibleIds,
  setSelected,
  bulkBusy,
  onBulkDelete,
  copy,
}: {
  allSelected: boolean;
  selected: string[];
  visibleIds: string[];
  setSelected: (value: string[]) => void;
  bulkBusy: boolean;
  onBulkDelete: () => void;
  copy: ReturnType<typeof questionsCopy>;
}) {
  return (
    <>
      <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          className="size-4 accent-brand"
          checked={allSelected}
          onChange={(event) =>
            setSelected(
              event.target.checked
                ? [...new Set([...selected, ...visibleIds])]
                : selected.filter((id) => !visibleIds.includes(id)),
            )
          }
        />
        {copy.selectResults}
      </label>
      {selected.length ? (
        <Button size="sm" variant="danger" loading={bulkBusy} onClick={onBulkDelete}>
          <Trash2 size={14} />
          {copy.deleteSelected(selected.length)}
        </Button>
      ) : null}
    </>
  );
}

function QuestionCard({
  question,
  index,
  selected,
  setSelected,
  canCreate,
  canUpdate,
  canDelete,
  onCopy,
  onEdit,
  onDelete,
  copy,
}: {
  question: QuestionView;
  index: number;
  selected: string[];
  setSelected: (value: string[]) => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onCopy: (question: QuestionView, index: number) => void;
  onEdit: (question: QuestionView, index: number) => void;
  onDelete: (question: QuestionView) => void;
  copy: ReturnType<typeof questionsCopy>;
}) {
  const options =
    question.options ||
    [question.option_a, question.option_b, question.option_c, question.option_d].filter(
      (option): option is string => Boolean(option),
    );
  const correct = question.correctOption || question.correct_option || question.correctAnswer;
  return (
    <article className="grid gap-3 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 shadow-[var(--shadow-surface)] transition hover:border-brand/40">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {canDelete && question.id ? (
            <input
              type="checkbox"
              className="size-4 accent-brand"
              checked={selected.includes(question.id)}
              onChange={(event) =>
                setSelected(
                  event.target.checked
                    ? [...new Set([...selected, question.id!])]
                    : selected.filter((id) => id !== question.id),
                )
              }
            />
          ) : null}
          <span className="text-xs font-bold text-brand">
            {copy.questionNumber(questionNumber(question, index + 1))}
          </span>
        </div>
        {question.id && (canCreate || canUpdate || canDelete) ? (
          <div className="flex shrink-0 gap-1">
            {canCreate ? (
              <Button
                className="h-8 px-2"
                variant="ghost"
                title={copy.copyForEditing}
                aria-label={copy.copyQuestion}
                onClick={() => onCopy(question, index)}
              >
                <Copy size={14} />
              </Button>
            ) : null}
            {canUpdate ? (
              <Button
                className="h-8 px-2"
                variant="ghost"
                aria-label={copy.editQuestionAction}
                onClick={() => onEdit(question, index)}
              >
                <Pencil size={14} />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                className="h-8 px-2"
                variant="danger"
                aria-label={copy.deleteQuestionAction}
                onClick={() => onDelete(question)}
              >
                <Trash2 size={14} />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <p className="text-sm leading-7">{question.question || question.text}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option, optionIndex) => (
          <Option
            key={optionIndex}
            index={optionIndex}
            value={option}
            active={correct === ["a", "b", "c", "d"][optionIndex] || correct === option}
          />
        ))}
      </div>
      {question.explanation || question.hint ? (
        <details className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <summary className="cursor-pointer font-semibold">{copy.explanationAndHint}</summary>
          {question.explanation ? <p className="mt-2">{question.explanation}</p> : null}
          {question.hint ? (
            <p className="mt-2 text-xs">
              {copy.hint}: {question.hint}
            </p>
          ) : null}
        </details>
      ) : null}
      {[question.book, question.chapter, question.lesson, question.topic].some(Boolean) ? (
        <p className="text-xs text-slate-500">
          {[question.book, question.chapter, question.lesson, question.topic]
            .filter(Boolean)
            .join(" • ")}
        </p>
      ) : null}
    </article>
  );
}

function Option({ index, value, active }: { index: number; value: string; active: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${active ? "bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-[rgb(var(--surface-muted))]"}`}
    >
      {active ? (
        <CheckCircle2 size={15} />
      ) : (
        <span className="grid size-4 place-items-center rounded-full border text-[9px]">
          {index + 1}
        </span>
      )}
      {value}
    </div>
  );
}
