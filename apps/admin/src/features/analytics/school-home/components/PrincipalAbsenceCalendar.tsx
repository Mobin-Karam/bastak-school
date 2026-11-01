import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api } from "../../../../shared/api/api";
import { Card, EmptyState } from "../../../../shared/ui/ui";
import { ResponsiveModal } from "../../../../shared/ui/responsive-modal";

type CalendarData = {
  start: string;
  end: string;
  days: Record<string, Array<{ id: string; name: string; context: string }>>;
};
const weekdayLabels = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
const iso = (value: Date) => value.toISOString().slice(0, 10);
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
  const calendar = useQuery({
    queryKey: ["principal-absence-calendar"],
    queryFn: () => api.get<CalendarData>("/dashboard/principal/absence-calendar"),
  });
  const dates = useMemo(() => {
    if (!calendar.data) return [];
    const start = new Date(`${calendar.data.start}T12:00:00Z`);
    return Array.from({ length: 42 }, (_, index) =>
      iso(new Date(start.getTime() + index * 86_400_000)),
    );
  }, [calendar.data]);
  const students = selected ? (calendar.data?.days[selected] ?? []) : [];
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
      {calendar.isError ? (
        <EmptyState title="بایگانی غیبت دریافت نشد" />
      ) : (
        <div className="grid grid-cols-7 gap-1.5" role="grid" aria-label="تقویم غیبت شش هفته">
          {weekdayLabels.map((label) => (
            <strong key={label} className="p-1 text-center text-[10px] text-slate-500">
              {label}
            </strong>
          ))}
          {dates.map((date) => {
            const count = calendar.data?.days[date]?.length ?? 0;
            return (
              <button
                key={date}
                type="button"
                disabled={!count}
                onClick={() => setSelected(date)}
                className={`min-h-16 rounded-lg border p-1 text-start transition focus-visible:ring-2 focus-visible:ring-brand ${monthTone(date)} ${count ? "text-rose-950 ring-1 ring-rose-500/45 dark:text-rose-100" : "text-slate-600 dark:text-slate-300"}`}
              >
                <time className="block text-[10px]" dateTime={date}>
                  {new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                    day: "numeric",
                    month: "numeric",
                  }).format(new Date(`${date}T12:00:00Z`))}
                </time>
                {count ? (
                  <b className="mt-1 block text-base">{count.toLocaleString("fa-IR")} غیبت</b>
                ) : (
                  <span className="mt-2 block text-[10px]">—</span>
                )}
              </button>
            );
          })}
        </div>
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
