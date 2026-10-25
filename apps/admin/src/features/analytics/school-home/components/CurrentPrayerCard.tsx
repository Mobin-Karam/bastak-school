import { memo } from "react";
import { Clock3, MoonStar } from "lucide-react";

import { fa } from "../../../../shared/lib/utils";
import { useCurrentPrayer } from "../hooks/use-current-prayer";
import type { PrayerSchedule } from "../model/current-prayer";

type CurrentPrayerCardProps = {
  times: PrayerSchedule | null | undefined;
  className?: string;
};

function normalizePrayerTime(value: string): string {
  return value
    .trim()
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function isValidPrayerTime(value: unknown): value is string {
  if (typeof value !== "string") return false;

  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(normalizePrayerTime(value));
}

/**
 * Compact, responsive prayer widget for school dashboards.
 *
 * - Mobile-first
 * - RTL
 * - Light/dark mode
 * - Low rendering cost
 * - No animation dependencies
 */
export const CurrentPrayerCard = memo(function CurrentPrayerCard({
  times,
  className = "",
}: CurrentPrayerCardProps) {
  const active = useCurrentPrayer(times);

  if (
    !active ||
    typeof active.label !== "string" ||
    !active.label.trim() ||
    !isValidPrayerTime(active.time)
  ) {
    return null;
  }

  const machineTime = normalizePrayerTime(active.time);
  const displayTime = fa(machineTime);

  return (
    <section
      dir="rtl"
      aria-label="وقت شرعی پیش رو"
      className={`
        group relative isolate
        flex w-full min-w-0
        items-center gap-3
        overflow-hidden
        rounded-2xl
        border border-teal-200/60
        bg-gradient-to-br
        from-teal-50 via-emerald-50 to-cyan-50
        px-3 py-3
        shadow-[0_5px_18px_-12px_rgba(13,148,136,0.35)]
        transition-colors duration-200

        dark:border-teal-800/40
        dark:from-slate-900
        dark:via-teal-950/60
        dark:to-slate-900

        sm:gap-4
        sm:rounded-3xl
        sm:px-4
        sm:py-4

        ${className}
      `}
    >
      {/* Decorative background glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute -right-10 -top-10
          size-28 rounded-full
          bg-emerald-300/20
          blur-2xl
          dark:bg-emerald-500/10
        "
      />

      {/* Prayer details */}
      <div className="relative z-10 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <MoonStar
            size={14}
            className="shrink-0 text-emerald-600 dark:text-emerald-300"
            aria-hidden="true"
          />
          <p className="truncate text-[10px] font-semibold text-teal-800/70 dark:text-teal-200/70 sm:text-xs">
            {active.tomorrow ? "نخستین وقت شرعی فردا" : "وقت شرعی پیش رو"}
          </p>
        </div>
        <p className="mt-1 text-sm font-black text-teal-950 dark:text-teal-50 sm:text-base">
          نماز {active.label}
        </p>

        <p
          className="
            mt-0.5 hidden
            text-[10px] font-medium
            text-slate-500
            dark:text-slate-400
            sm:block
          "
        >
          زمان‌بندی مدرسه · تهران
        </p>
      </div>

      {/* Prayer time */}
      <div className="relative z-10 flex shrink-0 flex-col items-end gap-1">
        <div
          className="
            flex items-center gap-1
            rounded-xl
            border border-white/70
            bg-white/75
            px-2.5 py-2

            shadow-[0_4px_12px_-9px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.9)]

            backdrop-blur-sm

            dark:border-white/10
            dark:bg-white/10

            sm:rounded-2xl
            sm:px-3
          "
        >
          <Clock3
            size={13}
            className="
              shrink-0 text-teal-600
              dark:text-teal-300
            "
            aria-hidden="true"
          />

          <time
            dateTime={machineTime}
            dir="ltr"
            lang="fa"
            className="
              whitespace-nowrap
              text-xl font-black
              leading-none
              tabular-nums
              tracking-tight
              text-teal-900
              dark:text-teal-100
              sm:text-2xl
            "
          >
            {displayTime}
          </time>
        </div>
      </div>
    </section>
  );
});
