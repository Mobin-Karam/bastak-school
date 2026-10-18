import { useQuery } from "@tanstack/react-query";
import { getLearningReviewHistory } from "../api/learning.api";
import { Badge, EmptyState } from "../../../shared/ui/ui";
import { LearningSkeleton } from "./LearningSkeleton";
import { useLocale } from "../../../shared/ui/locale";
import { learningCopy } from "../learning-locale";

export function ReviewHistory({
  studentId,
  itemId,
  formatDateTime,
}: {
  studentId: string;
  itemId: string;
  formatDateTime: (value?: string | Date) => string;
}) {
  const { language } = useLocale();
  const copy = learningCopy(language);
  const numberLocale = language === "fa" ? "fa-IR" : "en-US";
  const history = useQuery({
    queryKey: ["learning-history", studentId, itemId],
    queryFn: () => getLearningReviewHistory(studentId, itemId),
  });

  if (history.isLoading) {
    return <LearningSkeleton />;
  }

  if (history.isError) {
    return <EmptyState title={copy.historyFailed} />;
  }

  return history.data?.length ? (
    <div className="grid gap-2">
      {history.data.map((row) => (
        <article key={row.id} className="rounded-md border p-3">
          <div className="flex justify-between gap-2">
            <strong>
              {copy.mastery} {row.previousMastery.toLocaleString(numberLocale)} ←{" "}
              {row.newMastery.toLocaleString(numberLocale)}
            </strong>

            <Badge tone="blue">
              {copy.score} {row.rating.toLocaleString(numberLocale)}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(row.reviewedAt)} · {copy.nextInterval}{" "}
            {row.nextIntervalDays.toLocaleString(numberLocale)} {copy.days}
          </p>
        </article>
      ))}
    </div>
  ) : (
    <EmptyState title={copy.noHistory} />
  );
}
