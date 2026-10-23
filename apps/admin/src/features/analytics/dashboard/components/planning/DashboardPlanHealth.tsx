import { ArrowLeft, CalendarCheck2, CheckCircle2, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, EmptyState } from "../../../../../shared/ui/ui";
import { useLocale } from "../../../../../shared/ui/locale";
import { dashboardCopy } from "../../model/dashboard-copy";

export type DashboardPlanHealthValue = {
  plans: number;
  tasks: number;
  completed: number;
  completion: number;
};

export function dashboardPlanHealth(value?: {
  plans?: number;
  tasks?: number;
  completed?: number;
}): DashboardPlanHealthValue {
  const plans = Math.max(0, Number(value?.plans) || 0);
  const tasks = Math.max(0, Number(value?.tasks) || 0);
  const completed = Math.min(tasks, Math.max(0, Number(value?.completed) || 0));
  return {
    plans,
    tasks,
    completed,
    completion: tasks ? Math.round((completed / tasks) * 100) : 0,
  };
}

export function DashboardPlanHealth({
  value,
  href,
  title,
}: {
  value?: { plans?: number; tasks?: number; completed?: number };
  href?: string;
  title?: string;
  description?: string;
}) {
  const { language, profile } = useLocale();
  const copy = dashboardCopy[language];
  const health = dashboardPlanHealth(value);

  return (
    <Card className="p-3 sm:p-4" aria-labelledby="dashboard-plan-health-title">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <CalendarCheck2
            size={16}
            className="shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />

          <h2 id="dashboard-plan-health-title" className="truncate text-sm font-bold text-ink">
            {title || copy.planHealthTitle}
          </h2>
        </div>

        {health.plans ? (
          <strong className="shrink-0 text-lg font-bold tabular-nums text-ink">
            {health.completion.toLocaleString(profile.locale)}%
          </strong>
        ) : null}
      </div>

      {health.plans ? (
        <>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--surface-muted))]"
            role="progressbar"
            aria-label={copy.completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={health.completion}
          >
            <span
              className="block h-full rounded-full bg-emerald-600"
              style={{ inlineSize: `${health.completion}%` }}
            />
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <ListChecks size={13} aria-hidden="true" />
              {copy.plannedTasks}
              <strong className="tabular-nums text-ink">
                {health.tasks.toLocaleString(profile.locale)}
              </strong>
            </span>

            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <CheckCircle2 size={13} aria-hidden="true" />
              {copy.completedTasks}
              <strong className="tabular-nums text-ink">
                {health.completed.toLocaleString(profile.locale)}
              </strong>
            </span>
          </div>

          {href ? (
            <Link
              to={href}
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              {copy.openPlanner}
              <ArrowLeft size={13} aria-hidden="true" />
            </Link>
          ) : null}
        </>
      ) : (
        <div className="mt-3">
          <EmptyState title={copy.noPlanHealth} />
        </div>
      )}
    </Card>
  );
}
