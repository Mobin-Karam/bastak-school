import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, CircleAlert, Clock3, UserRoundCheck } from "lucide-react";
import { ManagementPageHeader } from "../../../shared/ui/management-workspace";
import { Badge, Card, EmptyState, ErrorState, LoadingState } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { listSelfAttendance, type SelfAttendanceRecord } from "../api/attendance.api";

const statusMeta: Record<
  SelfAttendanceRecord["status"],
  { label: string; tone: "green" | "red" | "amber" | "blue" }
> = {
  present: { label: "حاضر", tone: "green" },
  absent: { label: "غایب", tone: "red" },
  late: { label: "با تأخیر", tone: "amber" },
  excused: { label: "موجه", tone: "blue" },
};

export function MyAttendancePage() {
  const { formatDate } = useLocale();
  const attendance = useQuery({ queryKey: ["attendance", "self"], queryFn: listSelfAttendance });
  if (attendance.isLoading) return <LoadingState label="در حال دریافت حضور و غیاب…" />;
  if (attendance.isError)
    return (
      <ErrorState
        title="حضور و غیاب دریافت نشد."
        action={<button onClick={() => void attendance.refetch()}>تلاش دوباره</button>}
      />
    );
  const rows = attendance.data ?? [];
  const counts = rows.reduce<Record<SelfAttendanceRecord["status"], number>>(
    (total, row) => ({ ...total, [row.status]: total[row.status] + 1 }),
    { present: 0, absent: 0, late: 0, excused: 0 },
  );
  return (
    <section className="grid gap-4">
      <ManagementPageHeader
        eyebrow="حساب من"
        title="حضور و غیاب من"
        description="وضعیت‌های ثبت‌شده برای کلاس‌ها و فعالیت‌های شما."
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(statusMeta).map(([status, meta]) => (
          <Card key={status} className="p-3">
            <p className="text-xs text-slate-500">{meta.label}</p>
            <p className="mt-1 text-xl font-black text-ink">
              {counts[status as SelfAttendanceRecord["status"]].toLocaleString("fa-IR")}
            </p>
          </Card>
        ))}
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
              return (
                <li key={row.id} className="flex items-start gap-3 p-3">
                  <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    {row.status === "absent" ? (
                      <CircleAlert size={17} aria-hidden="true" />
                    ) : row.status === "late" ? (
                      <Clock3 size={17} aria-hidden="true" />
                    ) : (
                      <UserRoundCheck size={17} aria-hidden="true" />
                    )}
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
