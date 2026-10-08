import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, CircleAlert, CircleCheckBig, Clock3, UserRoundCheck } from "lucide-react";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import {
  getSelfAttendanceSummary,
  listSelfAttendance,
  type SelfAttendanceRecord,
} from "../api/attendance.api";

const statusMeta: Record<
  SelfAttendanceRecord["status"],
  {
    label: string;
    tone: "green" | "red" | "amber" | "blue";
    cardClass: string;
    icon: typeof CircleCheckBig;
  }
> = {
  present: {
    label: "حاضر",
    tone: "green",
    cardClass:
      "border-emerald-200 bg-[linear-gradient(145deg,#ecfdf5,#d1fae5)] text-emerald-950 shadow-[0_10px_18px_rgb(5_150_105_/_12%),inset_0_1px_0_rgb(255_255_255_/_75%)] dark:border-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100",
    icon: CircleCheckBig,
  },
  absent: {
    label: "غایب",
    tone: "red",
    cardClass:
      "border-rose-200 bg-[linear-gradient(145deg,#fff1f2,#ffe4e6)] text-rose-950 shadow-[0_10px_18px_rgb(225_29_72_/_11%),inset_0_1px_0_rgb(255_255_255_/_75%)] dark:border-rose-800 dark:bg-rose-950/35 dark:text-rose-100",
    icon: CircleAlert,
  },
  late: {
    label: "با تأخیر",
    tone: "amber",
    cardClass:
      "border-amber-200 bg-[linear-gradient(145deg,#fffbeb,#fef3c7)] text-amber-950 shadow-[0_10px_18px_rgb(217_119_6_/_11%),inset_0_1px_0_rgb(255_255_255_/_75%)] dark:border-amber-800 dark:bg-amber-950/35 dark:text-amber-100",
    icon: Clock3,
  },
  excused: {
    label: "موجه",
    tone: "blue",
    cardClass:
      "border-sky-200 bg-[linear-gradient(145deg,#f0f9ff,#e0f2fe)] text-sky-950 shadow-[0_10px_18px_rgb(14_165_233_/_10%),inset_0_1px_0_rgb(255_255_255_/_75%)] dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-100",
    icon: UserRoundCheck,
  },
};

export function MyAttendancePage() {
  const { formatDate } = useLocale();
  const attendance = useQuery({ queryKey: ["attendance", "self"], queryFn: listSelfAttendance });
  const summary = useQuery({
    queryKey: ["attendance", "self", "summary"],
    queryFn: getSelfAttendanceSummary,
  });
  if (attendance.isLoading) return <LoadingState label="در حال دریافت حضور و غیاب…" />;
  if (attendance.isError)
    return (
      <ErrorState
        title="حضور و غیاب دریافت نشد."
        action={<button onClick={() => void attendance.refetch()}>تلاش دوباره</button>}
      />
    );
  const rows = attendance.data ?? [];
  const recentCounts = rows.reduce<Record<SelfAttendanceRecord["status"], number>>(
    (total, row) => ({ ...total, [row.status]: total[row.status] + 1 }),
    { present: 0, absent: 0, late: 0, excused: 0 },
  );
  const counts = summary.data ?? recentCounts;
  return (
    <section className="grid gap-4">
      <ManagementPageHeader
        eyebrow="حساب من"
        title="حضور و غیاب من"
        description="وضعیت‌های ثبت‌شده برای کلاس‌ها و فعالیت‌های شما."
      />
      <p className="-mt-2 text-xs text-slate-500">
        {summary.data
          ? `${summary.data.totalSessions.toLocaleString("fa-IR")} جلسه ثبت‌شده در سوابق شما`
          : "خلاصه سوابق در حال دریافت است."}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(statusMeta).map(([status, meta]) => {
          const StatusIcon = meta.icon;
          return (
            <Card key={status} className={`relative overflow-hidden border p-3 ${meta.cardClass}`}>
              <span aria-hidden="true" className="absolute inset-x-3 top-0 h-px bg-white/80" />
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold opacity-75">{meta.label}</p>
                <StatusIcon size={18} strokeWidth={2.35} aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-black leading-none">
                {counts[status as SelfAttendanceRecord["status"]].toLocaleString("fa-IR")}
              </p>
            </Card>
          );
        })}
      </div>
      <Card className="p-0">
        <div className="flex items-center gap-2 border-b border-[rgb(var(--border-subtle))] p-3">
          <CalendarCheck2 size={18} className="text-brand" aria-hidden="true" />
          <h2 className="font-black">آخرین وضعیت‌ها</h2>
        </div>
        {rows.length ? (
          <ul className="divide-y divide-[rgb(var(--border-subtle))]">
            {rows.map((row) => {
              const meta = statusMeta[row.status];
              const StatusIcon = meta.icon;
              return (
                <li
                  key={row.id}
                  className="flex items-start gap-3 p-3 transition-colors hover:bg-[rgb(var(--surface-muted))]"
                >
                  <span
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border ${meta.cardClass}`}
                  >
                    <StatusIcon size={17} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">
                      {formatDate(row.sessionDate, { dateStyle: "medium" })}
                    </p>
                    {row.note ? (
                      <p className="mt-1 text-xs leading-5 text-slate-500">{row.note}</p>
                    ) : null}
                  </div>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="هنوز وضعیت حضوری برای شما ثبت نشده است." />
        )}
      </Card>
    </section>
  );
}
