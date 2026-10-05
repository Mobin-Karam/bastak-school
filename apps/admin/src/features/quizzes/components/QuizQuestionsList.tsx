import { CheckCircle2, Pencil, Search, Trash2 } from "lucide-react";
import { AdminList } from "../../../shared/ui/admin-list";
import { Badge, Button, Input } from "../../../shared/ui/ui";
import type { QuizQuestion } from "../model/quiz.types";
import { useQuizCopy } from "../model/quiz-locale";

type Props = {
  items: QuizQuestion[];
  loading: boolean;
  error: boolean;
  search: string;
  onSearch: (value: string) => void;
  onRetry: () => void;
  onEdit: (question: QuizQuestion, index: number) => void;
  onDelete: (question: QuizQuestion) => void;
  canManage: boolean;
};
export function QuizQuestionsList({
  items,
  loading,
  error,
  search,
  onSearch,
  onRetry,
  onEdit,
  onDelete,
  canManage,
}: Props) {
  const copy = useQuizCopy();
  return (
    <AdminList
      label={`${copy.questions} ${copy.quiz}`}
      description={
        copy.language === "en"
          ? "The correct option is marked on every card."
          : "گزینه درست در هر کارت مشخص است."
      }
      items={items}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle={
        copy.language === "en" ? "There are no questions to display." : "سؤالی برای نمایش نیست."
      }
      actions={
        <Badge tone="blue">
          {items.length.toLocaleString(copy.numberLocale)} {copy.questions}
        </Badge>
      }
      toolbar={
        <div className="relative">
          <Search
            className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <Input
            className="pe-9"
            type="search"
            placeholder={copy.searchQuestions}
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </div>
      }
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {items.map((item, index) => {
          const options =
            item.options ||
            [item.option_a, item.option_b, item.option_c, item.option_d].filter(
              (option): option is string => Boolean(option),
            );
          const correct = item.correctOption || item.correct_option || item.correctAnswer;
          return (
            <article
              key={item.id}
              className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-brand">
                    {copy.question} {(index + 1).toLocaleString(copy.numberLocale)}
                  </span>
                  <p className="mt-1 text-sm leading-6">
                    {item.question_text || item.question || item.text}
                  </p>
                </div>
                {canManage ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      className="h-8 px-2"
                      variant="ghost"
                      aria-label={copy.editQuestionLabel}
                      onClick={() => onEdit(item, index)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="danger"
                      className="h-8 px-2"
                      aria-label={copy.deleteQuestionLabel}
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {options.map((option, optionIndex) => {
                  const key = ["a", "b", "c", "d"][optionIndex];
                  const active = correct === key || correct === option;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${active ? "bg-emerald-50 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200" : "bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}
                    >
                      {active ? (
                        <CheckCircle2 size={15} />
                      ) : (
                        <span className="grid size-4 place-items-center rounded-full border text-[9px]">
                          {optionIndex + 1}
                        </span>
                      )}
                      {option}
                    </div>
                  );
                })}
              </div>
              {item.explanation ? (
                <details className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <summary className="cursor-pointer font-bold">{copy.answerExplanation}</summary>
                  <p className="mt-2 leading-5">{item.explanation}</p>
                </details>
              ) : null}
            </article>
          );
        })}
      </div>
    </AdminList>
  );
}
