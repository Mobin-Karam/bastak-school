import { useQuery } from "@tanstack/react-query";
import { Check, CircleSlash2, Clock3, Filter, X } from "lucide-react";
import { useState } from "react";
import { EmptyState, LoadingState } from "../../../../shared/ui/ui";
import {
  contextLabelMap,
  listSelfAttendance,
  type SelfAttendanceRecord,
} from "../api/attendance.api";

type HistoryStatus = "all" | SelfAttendanceRecord["status"];

const statusMeta: Record<
  SelfAttendanceRecord["status"],
  { label: string; className: string; Icon: typeof Check }
> = {
  present: {
    label: "حاضر",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
    Icon: Check,
  },
  absent: {
    label: "غایب",
    className: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
    Icon: X,
  },
  late: {
    label: "تأخیر",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200",
    Icon: Clock3,
  },
  excused: {
    label: "موجه",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
    Icon: CircleSlash2,
  },
};

function faDateTime(value: string) {
  return new Date(value).toLocaleString("fa-IR", {
    timeZone: "Asia/Tehran",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Mobile-first, student-scoped attendance timeline used on the page and the home drawer. */
export function StudentAttendanceHistoryList({ scope }: { scope: string }) {
  const [status, setStatus] = useState<HistoryStatus>("all");
  const history = useQuery({
    queryKey: ["student-attendance-profile", scope],
    queryFn: listSelfAttendance,
  });
  const records = (history.data ?? []).filter(
    (record) => status === "all" || record.status === status,
  );

  return (
    <section className="space-y-3" aria-label="ریز سابقه حضور" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-black text-ink">
          <Filter size={16} className="text-brand" aria-hidden="true" /> ریز سابقه حضور
        </h2>
        <span className="text-[11px] text-slate-500">
          {records.length.toLocaleString("fa-IR")} مورد
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="فیلتر وضعیت حضور">
        {(["all", "present", "absent", "late", "excused"] as const).map((item) => {
          const active = status === item;
          const label = item === "all" ? "همه" : statusMeta[item].label;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              onClick={() => setStatus(item)}
              className={`min-h-9 shrink-0 rounded-full px-3 text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${
                active
                  ? "bg-brand text-white"
                  : "bg-[rgb(var(--surface-muted))] text-slate-600 dark:text-slate-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {history.isLoading ? (
        <LoadingState label="در حال دریافت سابقه حضور…" />
      ) : history.isError ? (
        <p
          role="alert"
          className="rounded-2xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
        >
          سابقه حضور دریافت نشد.{" "}
          <button
            type="button"
            className="font-black underline"
            onClick={() => void history.refetch()}
          >
            تلاش دوباره
          </button>
        </p>
      ) : records.length ? (
        <ul className="grid gap-2" aria-label="فهرست سابقه حضور">
          {records.map((record) => (
            <AttendanceHistoryRow key={record.id} record={record} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title={
            status === "all"
              ? "هنوز سابقه‌ای برای حضور شما ثبت نشده است."
              : "موردی با این وضعیت پیدا نشد."
          }
        />
      )}
    </section>
  );
}

function AttendanceHistoryRow({ record }: { record: SelfAttendanceRecord }) {
  const meta = statusMeta[record.status];
  const Icon = meta.Icon;
  return (
    <li className="rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${meta.className}`}
          aria-label={meta.label}
        >
          <Icon size={19} strokeWidth={3} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-ink">{record.title || "جلسه حضور"}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {contextLabelMap[record.contextType]} · {faDateTime(record.recordedAt)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ${meta.className}`}
            >
              {meta.label}
            </span>
          </div>
          <div className="mt-2 grid gap-1 rounded-xl bg-[rgb(var(--surface-muted))] px-2.5 py-2 text-[11px] leading-5 text-slate-600 dark:text-slate-300">
            <p>
              <span className="font-black text-ink">زمان جلسه: </span>
              {faDateTime(record.sessionDate)}
            </p>
            <p>
              <span className="font-black text-ink">توضیح: </span>
              {record.note || "بدون توضیح ثبت‌شده"}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}
