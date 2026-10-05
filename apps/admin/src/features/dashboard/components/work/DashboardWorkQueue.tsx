import { AlertTriangle, ArrowLeft, CalendarClock, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SegmentedControl } from "../../../../shared/ui/segmented-control";
import { Badge, Button, Card, EmptyState } from "../../../../shared/ui/ui";
import { useLocale } from "../../../../shared/ui/locale";
import { dashboardCopy } from "../../model/dashboard-copy";
import type { DashboardWorkItem } from "../../model/dashboard.types";

type PriorityFilter = "all" | DashboardWorkItem["priority"];

const priorityTone = { urgent: "red", high: "amber", normal: "blue" } as const;

function workItemLabel(type: DashboardWorkItem["type"], copy: Record<string, string>) {
  return (
    {
      recovery: copy.workRecovery,
      task_issue: copy.workTaskIssue,
      retry_request: copy.workRetryRequest,
      unread_chat: copy.workUnreadChat,
      sync_failure: copy.workSyncFailure,
      inactive_user: copy.workInactiveUser,
    }[type] || copy.workQueueTitle
  );
}

export function DashboardWorkQueue({
  items,
  loading,
  error,
  onRetry,
}: {
  items: DashboardWorkItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const { language, profile } = useLocale();
  const copy = dashboardCopy[language];
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const visibleItems = useMemo(
    () => items.filter((item) => priority === "all" || item.priority === priority),
    [items, priority],
  );
  const count = (value: PriorityFilter) =>
    value === "all" ? items.length : items.filter((item) => item.priority === value).length;

  return (
    <Card className="overflow-hidden p-0" aria-labelledby="dashboard-work-queue-title">
      <header className="flex flex-col gap-3 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]/55 px-4 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="dashboard-work-queue-title" className="text-sm font-bold text-ink">
              {copy.workQueueTitle}
            </h2>
            <Badge tone="neutral">{items.length.toLocaleString(profile.locale)}</Badge>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            {copy.workQueueDescription}
          </p>
        </div>
        <Link
          to="/admin/attention"
          className="inline-flex min-h-8 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-xs font-semibold text-brand hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {copy.showAllWork}
          <ArrowLeft size={14} className="ltr:rotate-180" aria-hidden="true" />
        </Link>
      </header>

      <div className="border-b border-[rgb(var(--border-subtle))] px-4 py-2.5">
        <SegmentedControl
          ariaLabel={copy.workQueueFilter}
          value={priority}
          onValueChange={(value) => setPriority(value as PriorityFilter)}
          options={(["all", "urgent", "high", "normal"] as const).map((value) => ({
            value,
            label:
              value === "all"
                ? `${copy.all} ${count(value).toLocaleString(profile.locale)}`
                : `${copy[value]} ${count(value).toLocaleString(profile.locale)}`,
          }))}
        />
      </div>

      {loading ? (
        <div className="grid gap-2 p-3" aria-label={copy.workQueueTitle} aria-busy="true">
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-20 animate-pulse rounded-lg bg-[rgb(var(--surface-muted))]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-4">
          <EmptyState
            title={copy.workQueueFailed}
            action={
              <Button size="sm" variant="soft" onClick={onRetry}>
                <RefreshCw size={15} />
                {copy.retry}
              </Button>
            }
          />
        </div>
      ) : visibleItems.length ? (
        <div className="max-h-[34rem] divide-y divide-[rgb(var(--border-subtle))] overflow-y-auto overscroll-contain">
          {visibleItems.slice(0, 10).map((item) => (
            <article
              key={item.id}
              className="grid gap-3 px-4 py-3.5 transition-colors hover:bg-brand/[0.025] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={priorityTone[item.priority]}>
                    <AlertTriangle size={12} aria-hidden="true" />
                    {copy[item.priority]}
                  </Badge>
                  <strong className="min-w-0 truncate text-sm text-ink">
                    {workItemLabel(item.type, copy)}
                  </strong>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  {item.descriptionKind === "user"
                    ? item.description
                    : workItemLabel(item.type, copy)}
                </p>
                {item.dueAt ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <CalendarClock size={13} aria-hidden="true" />
                    {copy.dueOn.replace(
                      "{date}",
                      new Intl.DateTimeFormat(profile.locale, {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(item.dueAt)),
                    )}
                  </p>
                ) : null}
              </div>
              <Link
                to={item.deepLink}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[rgb(var(--border-subtle))] px-3 text-xs font-semibold text-ink transition hover:border-brand/30 hover:bg-brand/5 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                {copy.openWorkItem}
                <ArrowLeft size={14} className="ltr:rotate-180" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <EmptyState
            title={priority === "all" ? copy.workQueueEmpty : copy.workQueueEmptyPriority}
          />
        </div>
      )}
    </Card>
  );
}
