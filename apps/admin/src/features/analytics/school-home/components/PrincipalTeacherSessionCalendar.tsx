import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarCheck2 } from "lucide-react";
import { api } from "../../../../shared/api/api";
import { Card, EmptyState } from "../../../../shared/ui/ui";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { CompactMonthCalendar } from "../../../../shared/ui/compact-month-calendar";

type Data = {
  start: string;
  end: string;
  month: string;
  days: Record<string, Array<{ id: string; title: string; teacherName: string; saved: boolean }>>;
};
const iso = (date: Date) => date.toISOString().slice(0, 10);
const shiftMonth = (month: string, direction: number) => {
  const date = new Date(`${month}T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + direction, 1);
  return iso(date);
};
const currentMonth = () => `${iso(new Date()).slice(0, 8)}01`;

export function PrincipalTeacherSessionCalendar() {
  const [selected, setSelected] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const result = useQuery({
    queryKey: ["principal-teacher-session-calendar", month],
    queryFn: () => api.get<Data>(`/dashboard/principal/teacher-session-calendar?month=${month}`),
  });
  const dates = useMemo(
    () =>
      result.data
        ? Array.from({ length: 42 }, (_, index) =>
            iso(
              new Date(new Date(`${result.data!.start}T12:00:00Z`).getTime() + index * 86_400_000),
            ),
          )
        : [],
    [result.data],
  );
  const sessions = selected ? (result.data?.days[selected] ?? []) : [];
  const caption = result.data
    ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        year: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(`${result.data.month}T12:00:00Z`))
    : "";
  return (
    <Card className="p-4 sm:p-5" dir="rtl">
      <div className="mb-3 flex items-center gap-2">
        <CalendarCheck2 className="text-brand" />
        <div>
          <h2 className="font-black">پیگیری ثبت جلسه‌های استاد</h2>
          <p className="text-xs text-slate-500">قرمز: ثبت‌نشده · سبز: حضور جلسه ذخیره شده است.</p>
        </div>
      </div>
      {result.isError ? (
        <EmptyState title="تقویم جلسه‌های استاد دریافت نشد" />
      ) : (
        <CompactMonthCalendar
          label="تقویم جلسه‌های استاد"
          monthLabel={caption}
          onPreviousMonth={() => {
            setSelected(null);
            setMonth((value) => shiftMonth(value, -1));
          }}
          onNextMonth={() => {
            setSelected(null);
            setMonth((value) => shiftMonth(value, 1));
          }}
        >
          {dates.map((date) => {
            const rows = result.data?.days[date] ?? [];
            const done = rows.filter((item) => item.saved).length;
            const pending = rows.length - done;
            const outsideMonth = !date.startsWith(month.slice(0, 7));
            return (
              <button
                key={date}
                type="button"
                disabled={!rows.length}
                onClick={() => setSelected(date)}
                className={`min-h-[3.1rem] rounded-lg border px-1 py-1 text-center transition focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default ${outsideMonth ? "opacity-45" : ""} ${pending ? "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-100" : done ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100" : "border-transparent bg-transparent text-slate-500"}`}
              >
                <time className="block text-sm font-semibold leading-none" dateTime={date}>
                  {new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                    day: "numeric",
                  }).format(new Date(`${date}T12:00:00Z`))}
                </time>
                {rows.length ? (
                  <b className="mt-1 block text-[10px] leading-none">
                    {pending
                      ? `${pending.toLocaleString("fa-IR")} ناتمام`
                      : `${done.toLocaleString("fa-IR")} ثبت`}
                  </b>
                ) : (
                  <span className="mt-1 block text-[10px] leading-none">—</span>
                )}
              </button>
            );
          })}
        </CompactMonthCalendar>
      )}
      <ResponsiveModal
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title="جلسه‌های استاد"
        description={selected ?? ""}
      >
        <div className="grid gap-2" dir="rtl">
          {sessions.map((session) => (
            <div
              key={`${session.id}-${session.title}`}
              className={`rounded-lg border p-3 ${session.saved ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/25" : "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/25"}`}
            >
              <strong>{session.title}</strong>
              <small className="mt-1 block">
                {session.teacherName} · {session.saved ? "حضور ذخیره شده" : "حضور هنوز ثبت نشده"}
              </small>
            </div>
          ))}
        </div>
      </ResponsiveModal>
    </Card>
  );
}
