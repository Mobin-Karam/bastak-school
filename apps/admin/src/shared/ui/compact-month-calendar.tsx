import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

const weekdayLabels = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

type CompactMonthCalendarProps = {
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  children: ReactNode;
  label: string;
  loading?: boolean;
};

/** A compact, Saturday-first six-week calendar shell for operational dashboards. */
export function CompactMonthCalendar({
  monthLabel,
  onPreviousMonth,
  onNextMonth,
  children,
  label,
  loading = false,
}: CompactMonthCalendarProps) {
  return (
    <section
      className="mx-auto w-full max-w-[21rem] rounded-[1.35rem] border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))]/45 p-3 shadow-sm sm:max-w-[23rem] sm:p-4"
      aria-label={label}
      dir="rtl"
    >
      <div className="mb-3 grid grid-cols-[2.25rem_1fr_2.25rem] items-center">
        <button
          type="button"
          onClick={onPreviousMonth}
          disabled={loading}
          className="grid size-9 place-items-center rounded-full text-slate-600 transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-brand dark:text-slate-300 dark:hover:bg-white/10"
          aria-label="ماه قبل"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
        <strong className="text-center text-sm font-black text-slate-800 dark:text-slate-100">
          {monthLabel}
        </strong>
        <button
          type="button"
          onClick={onNextMonth}
          disabled={loading}
          className="grid size-9 place-items-center rounded-full text-slate-600 transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-brand dark:text-slate-300 dark:hover:bg-white/10"
          aria-label="ماه بعد"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div
        className="grid grid-cols-7 gap-x-1 gap-y-1.5"
        role="grid"
        aria-label={label}
        aria-busy={loading || undefined}
      >
        {weekdayLabels.map((label) => (
          <span
            key={label}
            className="pb-0.5 text-center text-[11px] font-medium text-slate-500 dark:text-slate-400"
          >
            {label}
          </span>
        ))}
        {loading ? <CompactMonthCalendarSkeleton /> : children}
      </div>
    </section>
  );
}

/** Keeps the six-week calendar footprint stable during an API month change. */
export function CompactMonthCalendarSkeleton() {
  return (
    <>
      {Array.from({ length: 42 }, (_, index) => (
        <span
          key={index}
          className="min-h-[3.1rem] rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] motion-safe:animate-pulse"
          aria-hidden="true"
        />
      ))}
    </>
  );
}
