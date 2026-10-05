import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CircleDot,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AdminList } from "../../../shared/ui/admin-list";
import { Badge, Button } from "../../../shared/ui/ui";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { useLocale } from "../../../shared/ui/locale";
import { getAttentionQueue, type AttentionItem } from "../api/attention.api";
import { useMemo, useState } from "react";
import {
  attentionCopy,
  attentionPriorityLabel,
  attentionSystemDescription,
  attentionTypeLabel,
} from "../attention-locale";

const priorityLabels = { urgent: "فوری", high: "بالا", normal: "عادی" } as const;
const priorityTones = { urgent: "red", high: "amber", normal: "blue" } as const;
export const attentionStatusLabels = { open: "باز" } as const;

export function formatAttentionDueDate(value: string, locale = "fa-IR") {
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...(value.length > 10 ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

const typeLabels: Record<AttentionItem["type"], string> = {
  recovery: "بازیابی",
  task_issue: "مسئله فعالیت",
  retry_request: "تلاش مجدد",
  unread_chat: "گفت‌وگو",
  sync_failure: "همگام‌سازی",
  inactive_user: "حساب",
};

export function AttentionPage() {
  const { language, profile } = useLocale();
  const copy = attentionCopy(language);
  const queue = useQuery({ queryKey: ["attention-queue"], queryFn: () => getAttentionQueue() });
  const [priority, setPriority] = useState<"all" | AttentionItem["priority"]>("all");
  const items = useMemo(
    () =>
      (queue.data?.items ?? []).filter((item) => priority === "all" || item.priority === priority),
    [priority, queue.data?.items],
  );

  return (
    <section className="space-y-4">
      <ManagementPageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <AdminList
        label={copy.queue}
        description={copy.queueDescription}
        items={items}
        loading={queue.isLoading}
        error={queue.isError}
        errorTitle={copy.loadFailed}
        onRetry={() => void queue.refetch()}
        toolbar={
          <CollectionToolbar
            filters={(["all", "urgent", "high", "normal"] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={`rounded px-2 py-1 text-[11px] ${priority === value ? "bg-[rgb(var(--surface-card))] font-semibold text-brand shadow-sm" : "text-slate-500"}`}
                onClick={() => setPriority(value)}
              >
                {value === "all" ? copy.all : attentionPriorityLabel(value, language)}
              </button>
            ))}
            resultLabel={`${items.length.toLocaleString(profile.locale)} ${language === "fa" ? "مورد" : "items"}`}
          />
        }
        actions={
          <Button
            size="sm"
            variant="soft"
            loading={queue.isFetching}
            onClick={() => void queue.refetch()}
          >
            <RefreshCw size={15} />
            {copy.refresh}
          </Button>
        }
        emptyTitle={priority === "all" ? copy.empty : copy.emptyPriority}
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <AttentionCard key={item.id} item={item} />
          ))}
        </div>
      </AdminList>
    </section>
  );
}

export function AttentionCard({ item }: { item: AttentionItem }) {
  const { language, profile } = useLocale();
  const copy = attentionCopy(language);
  return (
    <article className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 shadow-[var(--shadow-surface)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge tone={priorityTones[item.priority]}>
            <AlertTriangle size={13} />
            {attentionPriorityLabel(item.priority, language)}
          </Badge>
          <h2 className="mt-2 font-black text-ink">{attentionTypeLabel(item.type, language)}</h2>
        </div>
        <Badge tone="neutral">{attentionTypeLabel(item.type, language)}</Badge>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {item.descriptionKind === "user"
          ? item.description
          : attentionSystemDescription(item.type, language)}
      </p>
      <dl className="mt-4 grid gap-2 border-t border-[rgb(var(--border-subtle))] pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <UserRound size={14} />
          <dt className="sr-only">{copy.owner}</dt>
          <dd>{item.owner.label}</dd>
        </div>
        <div className="flex items-center gap-2">
          <CircleDot size={14} />
          <dt>{copy.status}</dt>
          <dd>{item.status === "open" ? copy.open : item.status}</dd>
        </div>
        {item.dueAt ? (
          <div className="flex items-center gap-2">
            <CalendarClock size={14} />
            <dt>{copy.due}</dt>
            <dd>{formatAttentionDueDate(item.dueAt, profile.locale)}</dd>
          </div>
        ) : null}
        {item.student ? (
          <div>
            <dt className="sr-only">{copy.student}</dt>
            <dd>
              {copy.student}: {item.student.name}
            </dd>
          </div>
        ) : null}
      </dl>
      <Link
        to={item.deepLink}
        className="mt-4 inline-flex h-9 items-center gap-1 rounded-lg bg-brand px-3 text-xs font-bold text-white outline-none transition hover:bg-brand/90 focus-visible:ring-4 focus-visible:ring-brand/20"
      >
        {copy.openItem} <ArrowUpRight size={14} />
      </Link>
    </article>
  );
}
