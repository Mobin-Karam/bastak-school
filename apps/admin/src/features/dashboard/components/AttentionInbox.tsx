import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  ChevronLeft,
  CircleGauge,
  Clock3,
  Radio,
  UserRoundSearch,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, EmptyState } from "../../../shared/ui/ui";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import { cn } from "../../../shared/lib/utils";
import { useLocale } from "../../../shared/ui/locale";
import { dashboardCopy } from "../model/dashboard-copy";
import type { AttentionSeverity, AttentionStudent } from "../model/dashboard.types";

type Filter = "all" | "red" | "yellow";

const reasonIcons = {
  overdue_reviews: BookOpenCheck,
  weak_exam_performance: CircleGauge,
  no_recent_activity: Clock3,
} as const;

function reasonLabel(code: string, fallback: string, copy: Record<string, string>) {
  return (
    {
      overdue_reviews: copy.overdueReviews,
      weak_exam_performance: copy.weakExamPerformance,
      no_recent_activity: copy.noRecentActivity,
    }[code] ||
    fallback ||
    copy.attentionSignal
  );
}

function severityTone(severity: AttentionSeverity) {
  return severity === "red" ? "red" : severity === "yellow" ? "amber" : "green";
}

export function AttentionInbox({
  students,
  loading,
  error,
  onRetry,
}: {
  students: AttentionStudent[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const { formatDateTime, language, profile } = useLocale();
  const copy = dashboardCopy[language];

  const filtered = useMemo(
    () => students.filter((student) => filter === "all" || student.severity === filter),
    [filter, students],
  );

  const critical = students.filter((student) => student.severity === "red").length;
  const warning = students.filter((student) => student.severity === "yellow").length;

  return (
    <Card id="attention-queue" className="scroll-mt-24 p-0">
      <header className="flex flex-col gap-3 border-b border-[rgb(var(--border-subtle))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-white">{copy.attentionTitle}</h3>
            <Badge tone={critical ? "red" : warning ? "amber" : "green"}>
              {students.length.toLocaleString(profile.locale)}
            </Badge>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {copy.attentionDescription}
          </p>
        </div>

        <SegmentedControl
          ariaLabel={copy.attentionFilter}
          value={filter}
          onValueChange={setFilter}
          options={[
            {
              value: "all",
              label: (
                <>
                  {copy.all} {students.length.toLocaleString(profile.locale)}
                </>
              ),
            },
            {
              value: "red",
              label: (
                <>
                  {copy.critical} {critical.toLocaleString(profile.locale)}
                </>
              ),
            },
            {
              value: "yellow",
              label: (
                <>
                  {copy.warning} {warning.toLocaleString(profile.locale)}
                </>
              ),
            },
          ]}
        />
      </header>

      {loading ? (
        <div className="grid gap-2 p-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-lg bg-[rgb(var(--surface-muted))]"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-4">
          <EmptyState
            title={copy.loadFailed}
            action={
              <Button variant="soft" onClick={onRetry}>
                {copy.retry}
              </Button>
            }
          />
        </div>
      ) : filtered.length ? (
        <div className="divide-y divide-[rgb(var(--border-subtle))]">
          {filtered.slice(0, 12).map((student) => {
            const online = Boolean(student.presence?.online);
            return (
              <article
                key={student.id}
                className="grid gap-3 px-4 py-3 transition hover:bg-[rgb(var(--surface-muted))] lg:grid-cols-[minmax(180px,.7fr)_minmax(0,1.5fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        student.severity === "red" ? "bg-rose-500" : "bg-amber-500",
                      )}
                    />
                    <strong className="truncate text-sm text-slate-900 dark:text-white">
                      {student.name}
                    </strong>
                    <Badge tone={severityTone(student.severity)}>
                      {student.severity === "red" ? copy.critical : copy.warning}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-400">
                    <span>
                      {[student.grade, student.major].filter(Boolean).join(" · ") ||
                        copy.academicProfile}
                    </span>
                    <span className="flex items-center gap-1">
                      {online ? (
                        <Radio size={10} className="text-emerald-500" />
                      ) : (
                        <Activity size={10} />
                      )}
                      {online
                        ? copy.online
                        : student.lastSeenAt
                          ? copy.lastActivity.replace("{date}", formatDateTime(student.lastSeenAt))
                          : copy.noActivity}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(student.reasons ?? []).map((reason) => {
                    const Icon =
                      reasonIcons[reason.code as keyof typeof reasonIcons] || AlertTriangle;
                    return (
                      <span
                        key={`${reason.code}-${reason.value}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[rgb(var(--surface-muted))] px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                      >
                        <Icon size={13} />
                        {reasonLabel(reason.code, reason.label, copy)}
                        <b className="tabular-nums">
                          {reason.value.toLocaleString(profile.locale)}
                          {reason.code === "weak_exam_performance" ? "%" : ""}
                        </b>
                      </span>
                    );
                  })}
                  {student.remainingTasks > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                      <Clock3 size={13} />
                      {student.remainingTasks.toLocaleString(profile.locale)} {copy.remainingTasks}
                    </span>
                  ) : null}
                </div>

                <div className="flex gap-2 lg:justify-end">
                  <Link
                    to={`/admin/communication/notifications?studentId=${encodeURIComponent(student.id)}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-white transition hover:brightness-90"
                  >
                    {copy.followUp}
                    <ChevronLeft
                      size={14}
                      className="rtl:group-hover:-translate-x-0.5 ltr:rotate-180 ltr:group-hover:translate-x-0.5"
                    />
                  </Link>
                  <Link
                    to={`/admin/students?studentId=${encodeURIComponent(student.id)}`}
                    className="grid size-9 place-items-center rounded-md border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] text-slate-500 transition hover:border-brand/30 hover:text-brand dark:text-slate-300"
                    aria-label={`${copy.openProfile} ${student.name}`}
                    title={copy.profileTitle}
                  >
                    <UserRoundSearch size={16} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <EmptyState title={filter === "all" ? copy.noAttention : copy.noSeverity} />
        </div>
      )}
    </Card>
  );
}
