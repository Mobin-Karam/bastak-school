import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api } from "../../../../shared/api/api";
import { Card, EmptyState } from "../../../../shared/ui/ui";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";
import { CompactMonthCalendar } from "../../../../shared/ui/compact-month-calendar";

type CalendarData = {
  start: string;
  end: string;
  month: string;
  days: Record<string, Array<{ id: string; name: string; context: string }>>;
};
const iso = (value: Date) => value.toISOString().slice(0, 10);
const shiftMonth = (month: string, direction: number) => {
  const date = new Date(`${month}T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + direction, 1);
  return iso(date);
};
const currentMonth = () => `${iso(new Date()).slice(0, 8)}01`;
const monthCaption = (month: string) =>
  new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${month}T12:00:00Z`));
const monthTone = (date: string) => {
  const month = Number(
    new Intl.DateTimeFormat("en-u-ca-persian", { month: "numeric" }).format(
      new Date(`${date}T12:00:00Z`),
    ),
  );
  return [
    "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/25",
    "border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/25",
    "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/25",
    "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/25",
  ][month % 4];
};

export function PrincipalAbsenceCalendar() {
  const [selected, setSelected] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth);
  const calendar = useQuery({
    queryKey: ["principal-absence-calendar", month],
    queryFn: () => api.get<CalendarData>(`/dashboard/principal/absence-calendar?month=${month}`),
  });
  const dates = useMemo(() => {
    if (!calendar.data) return [];
    const start = new Date(`${calendar.data.start}T12:00:00Z`);
    return Array.from({ length: 42 }, (_, index) =>
      iso(new Date(start.getTime() + index * 86_400_000)),
    );
  }, [calendar.data]);
  const students = selected ? (calendar.data?.days[selected] ?? []) : [];
  const caption = monthCaption(month);
  return (
    <Card className="principal-absence-calendar p-4 sm:p-5" dir="rtl">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="text-rose-700" />
        <div>
          <h2 className="font-black">بایگانی غیبت کلاس‌ها</h2>
          <p className="text-xs text-slate-500">
            شش هفته؛ هر روز را برای فهرست دانش‌آموزان غایب باز کنید.
          </p>
        </div>
      </div>
      {calendar.isError && !calendar.data ? (
        <EmptyState title="بایگانی غیبت دریافت نشد" />
      ) : (
        <CompactMonthCalendar
          label="تقویم غیبت شش هفته"
          monthLabel={caption}
          onPreviousMonth={() => {
            setSelected(null);
            setMonth((value) => shiftMonth(value, -1));
          }}
          onNextMonth={() => {
            setSelected(null);
            setMonth((value) => shiftMonth(value, 1));
          }}
          loading={calendar.isLoading || calendar.isFetching}
        >
          {dates.map((date) => {
            const count = calendar.data?.days[date]?.length ?? 0;
            const outsideMonth = !date.startsWith(month.slice(0, 7));
            return (
              <button
                key={date}
                type="button"
                disabled={!count}
                onClick={() => setSelected(date)}
                className={`min-h-[3.1rem] rounded-lg border px-1 py-1 text-center transition focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-default ${monthTone(date)} ${outsideMonth ? "opacity-45" : ""} ${count ? "text-rose-950 ring-1 ring-rose-500/45 dark:text-rose-100" : "text-slate-600 dark:text-slate-300"}`}
              >
                <time className="block text-sm font-semibold leading-none" dateTime={date}>
                  {new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                    day: "numeric",
                  }).format(new Date(`${date}T12:00:00Z`))}
                </time>
                {count ? (
                  <b className="mt-1 block text-[10px] leading-none">
                    {count.toLocaleString("fa-IR")} غیبت
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
        title="دانش‌آموزان غایب"
        description={
          selected
            ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", { dateStyle: "full" }).format(
                new Date(`${selected}T12:00:00Z`),
              )
            : ""
        }
      >
        <div className="grid gap-2" dir="rtl">
          {students.length ? (
            students.map((student) => (
              <div
                key={student.id}
                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-950 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-100"
              >
                <div>{student.name}</div>
                <small className="font-normal opacity-75">{student.context}</small>
              </div>
            ))
          ) : (
            <EmptyState title="غیبتی ثبت نشده است" />
          )}
        </div>
      </ResponsiveModal>
    </Card>
  );
}
