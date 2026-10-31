import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import type { HistoricalAttendanceCandidate } from "../api/attendance-operations.api";

const weekdays = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

function dateAtNoon(iso: string) {
  return new Date(`${iso}T12:00:00Z`);
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function monthBounds(iso: string) {
  const date = dateAtNoon(iso);
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12));
  return { start: isoDate(start), end: isoDate(end) };
}

function shiftMonth(iso: string, amount: number) {
  const date = dateAtNoon(iso);
  return isoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1, 12)));
}

function weekdayIndex(iso: string) {
  return (dateAtNoon(iso).getUTCDay() + 1) % 7;
}

export function PendingScheduleCalendar({
  candidates,
  selectedDate,
  onSelectedDateChange,
  onMonthChange,
  disabled,
}: {
  candidates: HistoricalAttendanceCandidate[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onMonthChange: (monthStart: string) => void;
  disabled?: boolean;
}) {
  const bounds = monthBounds(selectedDate);
  const sessionsByDay = useMemo(() => {
    const grouped = new Map<string, HistoricalAttendanceCandidate[]>();
    candidates.forEach((candidate) => {
      grouped.set(candidate.date, [...(grouped.get(candidate.date) ?? []), candidate]);
    });
    return grouped;
  }, [candidates]);
  const days = useMemo(() => {
    const start = dateAtNoon(bounds.start);
    start.setUTCDate(start.getUTCDate() - weekdayIndex(bounds.start));
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      return isoDate(date);
    });
  }, [bounds.start]);
  const displayMonth = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateAtNoon(bounds.start));
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((all, part) => ({ ...all, [part.type]: part.value }), {});
  const todayIso = `${today.year}-${today.month}-${today.day}`;

  return (
    <section
      aria-label="تقویم جلسه‌های ثبت‌نشده"
      className="rounded-2xl border border-amber-200 bg-white/70 p-3 dark:border-amber-900 dark:bg-slate-950/35"
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl border border-[rgb(var(--border-subtle))] text-slate-700 hover:bg-[rgb(var(--surface-muted))] focus-visible:ring-2 focus-visible:ring-brand/50 dark:text-slate-200"
          aria-label="ماه بعد"
          disabled={disabled}
          onClick={() => {
            const next = shiftMonth(bounds.start, 1);
            onSelectedDateChange(next);
            onMonthChange(next);
          }}
        >
          <ChevronRight size={18} />
        </button>
        <div className="text-center">
          <h4 className="text-sm font-black text-ink">{displayMonth}</h4>
          <p className="mt-0.5 text-[11px] text-slate-500">
            عدد روی هر روز، جلسه‌های ثبت‌نشده است.
          </p>
        </div>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-xl border border-[rgb(var(--border-subtle))] text-slate-700 hover:bg-[rgb(var(--surface-muted))] focus-visible:ring-2 focus-visible:ring-brand/50 dark:text-slate-200"
          aria-label="ماه قبل"
          disabled={disabled}
          onClick={() => {
            const previous = shiftMonth(bounds.start, -1);
            onSelectedDateChange(previous);
            onMonthChange(previous);
          }}
        >
          <ChevronLeft size={18} />
        </button>
      </div>
      <div
        className="mt-3 grid grid-cols-7 gap-1 text-center"
        role="grid"
        aria-label={displayMonth}
      >
        {weekdays.map((weekday) => (
          <div
            key={weekday}
            className="py-1 text-[10px] font-bold text-slate-500"
            role="columnheader"
          >
            {weekday}
          </div>
        ))}
        {days.map((date) => {
          const inMonth = date >= bounds.start && date <= bounds.end;
          const count = sessionsByDay.get(date)?.length ?? 0;
          const selected = date === selectedDate;
          const label = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(dateAtNoon(date));
          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              disabled={disabled || !inMonth}
              aria-pressed={selected}
              aria-label={`${label}${count ? `، ${count.toLocaleString("fa-IR")} جلسه ثبت‌نشده` : "، جلسه ثبت‌نشده ندارد"}`}
              onClick={() => onSelectedDateChange(date)}
              className={`relative min-h-11 rounded-lg border text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 ${!inMonth ? "cursor-default border-transparent text-slate-300 dark:text-slate-700" : selected ? "border-brand bg-brand text-white" : count ? "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" : "border-transparent text-slate-600 hover:bg-[rgb(var(--surface-muted))] dark:text-slate-300"}`}
            >
              <span>
                {new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
                  day: "numeric",
                  timeZone: "UTC",
                }).format(dateAtNoon(date))}
              </span>
              {count ? (
                <span
                  className={`absolute end-1 top-1 grid min-w-4 place-items-center rounded-full px-1 text-[9px] ${selected ? "bg-white text-brand" : "bg-amber-600 text-white"}`}
                >
                  {count.toLocaleString("fa-IR")}
                </span>
              ) : null}
              {date === todayIso ? (
                <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-current" />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
