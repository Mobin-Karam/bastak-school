import { CalendarDays, Clock3 } from "lucide-react";
import { Card, EmptyState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { dashboardCopy } from "../model/dashboard-copy";
import type { RoleDashboardData } from "../model/dashboard.types";

export type DashboardScheduleItem = {
  id: string;
  title: string;
  subject?: string;
  startTime?: string;
};

/**
 * Shapes only data that the Dashboard API already returned for the active
 * role. It does not fetch or infer schedule data on the client.
 */
export function dashboardScheduleItems(data: RoleDashboardData): DashboardScheduleItem[] {
  const source = data.upcomingExams ?? data.upcomingGoals ?? [];
  return source.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    subject: item.subject,
    startTime: item.startTime,
  }));
}

export function DashboardSchedule({ data }: { data: RoleDashboardData }) {
  const { language, profile } = useLocale();
  const copy = dashboardCopy[language];
  const items = dashboardScheduleItems(data);

  return (
    <Card className="p-0" aria-labelledby="dashboard-schedule-title">
      <header className="flex items-start gap-2 border-b border-[rgb(var(--border-subtle))] px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-brand/10 text-brand">
          <CalendarDays size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="dashboard-schedule-title" className="text-sm font-bold text-ink">
            {copy.upcomingScheduleTitle}
          </h2>
          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {copy.upcomingScheduleDescription}
          </p>
        </div>
      </header>

      {items.length ? (
        <ol className="divide-y divide-[rgb(var(--border-subtle))]">
          {items.map((item) => (
            <li key={item.id} className="px-4 py-3">
              <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {item.subject ? <span>{item.subject}</span> : null}
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={13} aria-hidden="true" />
                  {item.startTime
                    ? new Intl.DateTimeFormat(profile.locale, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(item.startTime))
                    : copy.dateToBeConfirmed}
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="p-4">
          <EmptyState title={copy.upcomingScheduleEmpty} />
        </div>
      )}
    </Card>
  );
}
