import { Edit3, History, RefreshCw, Trash2 } from "lucide-react";
import { todayIso } from "../../../shared/lib/utils";
import { Badge, Button } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { isLearningDue, type LearningItem } from "../model/learning-model";
import { learningCopy, learningStatusLabel } from "../learning-locale";

export function LearningRow({
  item,
  formatDate,
  onEdit,
  onReview,
  onHistory,
  onDelete,
}: {
  item: LearningItem;
  formatDate: (value?: string | Date) => string;
  onEdit?: () => void;
  onReview?: () => void;
  onHistory: () => void;
  onDelete?: () => void;
}) {
  const { language } = useLocale();
  const copy = learningCopy(language);
  const numberLocale = language === "fa" ? "fa-IR" : "en-US";
  const due = isLearningDue(item, todayIso());

  return (
    <article
      className={[
        "rounded-lg border p-3 shadow-[var(--shadow-surface)]",
        due
          ? "border-rose-200 bg-rose-50/40"
          : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="truncate">{item.title}</strong>

            <Badge
              tone={
                due
                  ? "red"
                  : item.status === "archived"
                    ? "neutral"
                    : item.status === "done"
                      ? "green"
                      : "amber"
              }
            >
              {due ? copy.due : learningStatusLabel(item.status, language)}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {[item.subject, item.book, item.chapter, item.lesson, item.topic]
              .filter(Boolean)
              .join(" · ") || copy.uncategorized}
          </p>
        </div>

        <div className="flex gap-1">
          <Button
            className="size-9 p-0"
            variant="ghost"
            aria-label={copy.history}
            onClick={onHistory}
          >
            <History size={15} />
          </Button>

          {onReview ? (
            <Button
              className="size-9 p-0"
              variant="ghost"
              aria-label={copy.review}
              onClick={onReview}
            >
              <RefreshCw size={15} />
            </Button>
          ) : null}

          {onEdit ? (
            <Button size="icon" variant="ghost" aria-label={copy.edit} onClick={onEdit}>
              <Edit3 size={15} />
            </Button>
          ) : null}

          {onDelete ? (
            <Button
              className="size-9 p-0 text-rose-700"
              variant="ghost"
              aria-label={copy.remove}
              onClick={onDelete}
            >
              <Trash2 size={15} />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-md bg-[rgb(var(--surface-muted))] px-2 py-1">
          {copy.nextReview}: {formatDate(item.dueDate)}
        </span>

        <span className="rounded-md bg-[rgb(var(--surface-muted))] px-2 py-1">
          {copy.mastery} {item.mastery.toLocaleString(numberLocale)}/5
        </span>

        <span className="rounded-md bg-[rgb(var(--surface-muted))] px-2 py-1">
          {item.reviewCount.toLocaleString(numberLocale)} {copy.reviews}
        </span>

        <span className="rounded-md bg-[rgb(var(--surface-muted))] px-2 py-1">
          {copy.interval} {item.intervalDays.toLocaleString(numberLocale)} {copy.days}
        </span>

        {item.sourceAnswerId ? (
          <span className="rounded-md bg-indigo-50 px-2 py-1 text-indigo-700">
            {copy.linkedAnswer}
          </span>
        ) : null}
      </div>

      {item.note || item.hint ? (
        <details className="mt-2 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold">{copy.notesAndHint}</summary>

          {item.note ? <p className="mt-2">{item.note}</p> : null}

          {item.hint ? (
            <p className="mt-1 text-indigo-800">
              {copy.hintPrefix} {item.hint}
            </p>
          ) : null}
        </details>
      ) : null}
    </article>
  );
}
