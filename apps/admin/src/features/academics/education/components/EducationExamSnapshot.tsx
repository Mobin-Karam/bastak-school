import type { UseQueryResult } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ManagementStat } from "../../../shared/ui/management-workspace";
import { Button, Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import type { Exam } from "../../../shared/types/domain";
import type { RetryRequest } from "../../exams/model/exam.types";
import { educationMetrics, subjectDistribution } from "../model/education-overview";
import { useLocale } from "../../../shared/ui/locale";
import { educationCopy } from "../model/education-copy";

export function EducationExamSnapshot({
  exams,
  retries,
}: {
  exams: Pick<UseQueryResult<Exam[]>, "data" | "isError" | "isLoading" | "refetch">;
  retries: Pick<UseQueryResult<RetryRequest[]>, "data">;
}) {
  const locale = useLocale();
  const copy = educationCopy(locale.language);
  if (exams.isLoading) return <LoadingState label={copy.loadingExamSnapshot} />;
  if (exams.isError)
    return (
      <EmptyState
        title={copy.examSnapshotFailed}
        action={
          <Button variant="soft" onClick={() => void exams.refetch()}>
            {locale.language === "fa" ? "تلاش دوباره" : "Try again"}
          </Button>
        }
      />
    );

  const rows = exams.data || [];
  const metrics = educationMetrics(rows, retries.data || []);
  const subjects = subjectDistribution(rows);
  const attention = rows
    .filter((exam) => !exam.published || !exam.delivery?.questionCount)
    .slice(0, 4);

  return (
    <>
      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label={copy.examMetrics}>
        {metrics.map((metric) => (
          <ManagementStat
            key={metric.key}
            label={metric.label}
            value={metric.value}
            tone={metric.tone}
          />
        ))}
      </section>
      <section className="grid gap-3 lg:grid-cols-2">
        <Card className="p-3">
          <h2 className="text-sm font-black text-ink">{copy.frequentTopics}</h2>
          {subjects.length ? (
            <div className="mt-2 grid gap-1">
              {subjects.slice(0, 5).map((item) => (
                <div
                  key={item.subject}
                  className="flex justify-between border-b border-slate-100 py-1.5 text-xs dark:border-slate-800"
                >
                  <span>{item.subject}</span>
                  <strong>
                    {item.count.toLocaleString(locale.profile.locale)} {copy.exams}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">{copy.noTopics}</p>
          )}
        </Card>
        <Card className="p-3">
          <h2 className="text-sm font-black text-ink">{copy.needsAttention}</h2>
          <p className="mt-1 text-xs text-slate-500">{copy.attentionDescription}</p>
          <div className="mt-2 grid gap-1">
            {attention.map((exam) => (
              <Link
                className="flex justify-between rounded-md px-2 py-1.5 text-xs hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                key={exam.id}
                to="/admin/exams"
              >
                <span className="truncate">{exam.title}</span>
                <span className="text-amber-700">
                  {!exam.delivery?.questionCount ? copy.noQuestions : copy.draft}
                </span>
              </Link>
            ))}
            {!attention.length ? <p className="text-xs text-emerald-700">{copy.noItems}</p> : null}
          </div>
        </Card>
      </section>
    </>
  );
}
