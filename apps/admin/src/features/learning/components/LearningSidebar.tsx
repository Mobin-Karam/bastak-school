import { Card } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { LearningSummary } from "../model/learning-model";
import { learningCopy } from "../learning-locale";

export function LearningSidebar({ summary }: { summary?: LearningSummary }) {
  const { language } = useLocale();
  const copy = learningCopy(language);
  const numberLocale = language === "fa" ? "fa-IR" : "en-US";
  return (
    <aside className="grid content-start gap-4 xl:sticky xl:top-20">
      <Card>
        <h3 className="mb-3 font-bold">{copy.subjectStatus}</h3>

        {summary?.subjects?.length ? (
          <div className="grid gap-3">
            {summary.subjects.map((row) => (
              <div key={row.subject}>
                <div className="mb-1 flex justify-between text-xs">
                  <strong>{row.subject}</strong>

                  <span>
                    {row.due.toLocaleString(numberLocale)} {copy.dueCount}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className="block h-full rounded-full bg-indigo-600"
                    style={{
                      width: `${Math.min(100, row.mastery * 20)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{copy.noData}</p>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 font-bold">{copy.mistakePatterns}</h3>

        {summary?.mistakePatterns?.length ? (
          <div className="grid gap-2">
            {summary.mistakePatterns.slice(0, 8).map((row, index) => (
              <div
                key={`${row.subject}-${row.reason}-${index}`}
                className="rounded-md bg-rose-50 p-2 text-xs text-rose-800"
              >
                <strong>{row.subject || copy.noSubject}</strong>

                <p className="mt-1">
                  {row.reason} · {row.count.toLocaleString(numberLocale)} {copy.times}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{copy.noMistakes}</p>
        )}
      </Card>
    </aside>
  );
}
