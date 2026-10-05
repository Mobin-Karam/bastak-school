import { ArrowLeft, CalendarCheck2, CheckCircle2, ListChecks } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, EmptyState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { dashboardCopy } from "../model/dashboard-copy";

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
  description,
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
    <Card className="p-0" aria-labelledby="dashboard-plan-health-title">
      <header className="flex items-start gap-2 border-b border-[rgb(var(--border-subtle))] px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <CalendarCheck2 size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="dashboard-plan-health-title" className="text-sm font-bold text-ink">
            {title || copy.planHealthTitle}
          </h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {description || copy.planHealthDescription}
          </p>
        </div>
      </header>

      {health.plans ? (
        <div className="grid gap-3 p-4">
          <div className="flex items-end justify-between gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {copy.completionRate}
            </span>
            <strong className="text-2xl font-black tabular-nums text-ink">
              {health.completion.toLocaleString(profile.locale)}%
            </strong>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-muted))]"
            role="progressbar"
            aria-label={copy.completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={health.completion}
          >
            <span
              className="block h-full rounded-full bg-emerald-600 motion-reduce:transition-none"
              style={{ inlineSize: `${health.completion}%` }}
            />
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-[rgb(var(--surface-muted))] p-2">
              <dt className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <ListChecks size={13} aria-hidden="true" />
                {copy.plannedTasks}
              </dt>
              <dd className="mt-1 font-bold tabular-nums text-ink">
                {health.tasks.toLocaleString(profile.locale)}
              </dd>
            </div>
            <div className="rounded-md bg-[rgb(var(--surface-muted))] p-2">
              <dt className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <CheckCircle2 size={13} aria-hidden="true" />
                {copy.completedTasks}
              </dt>
              <dd className="mt-1 font-bold tabular-nums text-ink">
                {health.completed.toLocaleString(profile.locale)}
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="p-4">
          <EmptyState title={copy.noPlanHealth} />
        </div>
      )}

      {href ? (
        <footer className="border-t border-[rgb(var(--border-subtle))] px-3 py-2">
          <Link
            to={href}
            className="inline-flex min-h-8 items-center gap-1 rounded-md px-1 text-xs font-semibold text-brand hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            {copy.openPlanner}
            <ArrowLeft size={14} className="ltr:rotate-180" aria-hidden="true" />
          </Link>
        </footer>
      ) : null}
    </Card>
  );
}
