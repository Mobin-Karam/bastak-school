import { BookOpenCheck, CalendarClock, Sparkles, TrendingUp } from "lucide-react";
import type { LearningSummary } from "../model/learning-model";
import { LearningMetric } from "./LearningMetric";
import { useLocale } from "../../../shared/ui/locale";
import { learningCopy } from "../learning-locale";

export function LearningSummaryMetrics({ summary }: { summary?: LearningSummary }) {
  const { language } = useLocale();
  const copy = learningCopy(language);
  const numberLocale = language === "fa" ? "fa-IR" : "en-US";
  return (
    <section className="grid grid-cols-2 gap-2 lg:grid-cols-6">
      <LearningMetric icon={Sparkles} label={copy.metrics[0]} value={summary?.totalItems} />

      <LearningMetric
        icon={CalendarClock}
        label={copy.metrics[1]}
        value={summary?.dueItems}
        tone="red"
      />

      <LearningMetric
        icon={BookOpenCheck}
        label={copy.metrics[2]}
        value={summary?.pendingItems}
        tone="amber"
      />

      <LearningMetric
        icon={TrendingUp}
        label={copy.metrics[3]}
        value={`${Number(summary?.averageMastery || 0).toLocaleString(numberLocale)} / 5`}
        tone="green"
      />

      <LearningMetric icon={BookOpenCheck} label={copy.metrics[4]} value={summary?.attempts} />

      <LearningMetric
        icon={TrendingUp}
        label={copy.metrics[5]}
        value={`${Number(summary?.averageExamPercent || 0).toLocaleString(numberLocale)}%`}
      />
    </section>
  );
}
