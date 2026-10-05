import { Eye } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Badge, Button, EmptyState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { examsCopy } from "../exams-locale";
import type { AttemptSummary } from "../model/exam-model";

export function AttemptHistoryList({
  history,
  onSelect,
}: {
  history: UseQueryResult<AttemptSummary[], Error>;
  onSelect: (attemptId: string) => void;
}) {
  const { language, formatDate } = useLocale();
  const copy = examsCopy(language);
  if (history.isLoading) {
    return (
      <div className="grid gap-2">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-20 animate-pulse rounded-md bg-slate-100" />
        ))}
      </div>
    );
  }

  if (history.isError) {
    return (
      <EmptyState
        title={copy.attemptHistoryFailed}
        action={
          <Button variant="soft" onClick={() => void history.refetch()}>
            {copy.retry}
          </Button>
        }
      />
    );
  }

  if (!history.data?.length) {
    return <EmptyState title={copy.noAttempts} />;
  }

  return (
    <div className="grid max-h-[65vh] gap-2 overflow-auto" aria-label={copy.history}>
      {history.data.map((attempt) => (
        <button
          key={attempt.id}
          className="grid gap-2 rounded-lg border p-3 text-start transition hover:border-brand hover:bg-teal-50 sm:grid-cols-[minmax(0,1fr)_auto]"
          onClick={() => onSelect(attempt.id)}
        >
          <span>
            <strong className="block">{attempt.title || copy.untitledExam}</strong>

            <small className="text-slate-500">
              {formatDate(attempt.submittedAt)} •{" "}
              {copy.attemptDuration(Math.round(Number(attempt.durationSeconds || 0) / 60))}
            </small>
          </span>

          <span className="flex items-center gap-2">
            <Badge tone={attempt.percent >= 70 ? "green" : attempt.percent >= 40 ? "amber" : "red"}>
              {attempt.percent.toLocaleString(language === "fa" ? "fa-IR" : "en-US")}%
            </Badge>

            <small>{copy.attemptResult(attempt.correct, attempt.wrong, attempt.blank)}</small>

            <Eye size={16} />
          </span>
        </button>
      ))}
    </div>
  );
}
