import { useQuery } from "@tanstack/react-query";
import { Check, CircleSlash2, Clock3, X } from "lucide-react";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { AttendanceCoin } from "../../../../shared/ui/attendance-coin";
import { EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { listSelfAttendance, type SelfAttendanceRecord } from "../api/attendance.api";

type StudentAttendanceProfileDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  points: number;
  scope: string;
};

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

/** Student-owned, scoped history. The server decides which records exist. */
export function StudentAttendanceProfileDrawer({
  open,
  onOpenChange,
  points,
  scope,
}: StudentAttendanceProfileDrawerProps) {
  const history = useQuery({
    queryKey: ["student-attendance-profile", scope],
    queryFn: listSelfAttendance,
    enabled: open,
  });

  return (
    <ResponsiveDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="پرونده کامل حضور من"
      description="برای بستن، دستگیره بالای پنل را به پایین بکشید."
      className="md:w-[min(34rem,92vw)]"
    >
      <section aria-label="تاریخچه کامل حضور" className="space-y-4" dir="rtl">
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <span className="flex items-center gap-2 text-sm font-black">
            <AttendanceCoin className="size-5 object-contain" /> سکه‌های حضور و رفتار
          </span>
          <strong className="text-xl">{points.toLocaleString("fa-IR")}</strong>
        </div>

        {history.isLoading ? (
          <LoadingState label="در حال دریافت تاریخچه حضور…" />
        ) : history.isError ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
          >
            تاریخچه حضور دریافت نشد.{" "}
            <button
              type="button"
              className="font-black underline"
              onClick={() => void history.refetch()}
            >
              تلاش دوباره
            </button>
          </div>
        ) : history.data?.length ? (
          <ul className="space-y-2" aria-label="سوابق حضور کلاس‌ها">
            {history.data.map((record) => {
              const meta = statusMeta[record.status];
              const Icon = meta.Icon;
              return (
                <li
                  key={record.id}
                  className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-card p-3"
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-full ${meta.className}`}
                    aria-label={meta.label}
                  >
                    <Icon size={19} strokeWidth={3} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-ink">
                      {record.title || "جلسه حضور"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(record.sessionDate).toLocaleDateString("fa-IR", {
                        timeZone: "Asia/Tehran",
                        dateStyle: "medium",
                      })}
                      {record.note ? ` · ${record.note}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="هنوز سابقه‌ای برای حضور شما ثبت نشده است." />
        )}
      </section>
    </ResponsiveDrawer>
  );
}
