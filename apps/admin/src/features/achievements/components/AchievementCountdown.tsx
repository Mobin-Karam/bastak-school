import { useEffect, useState } from "react";

/** Both Student future-feature pages launch together after their 90-day preview window. */
export const STUDENT_FUTURE_FEATURE_RELEASE_AT = new Date("2027-01-23T00:00:00+03:30").getTime();

function remainingTime(releaseAt: number) {
  const seconds = Math.max(0, Math.floor((releaseAt - Date.now()) / 1_000));
  return {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor((seconds % 86_400) / 3_600),
    minutes: Math.floor((seconds % 3_600) / 60),
    seconds: seconds % 60,
  };
}

const twoDigits = (value: number) => value.toLocaleString("fa-IR", { minimumIntegerDigits: 2 });

/** Release clock rendered in the intentional left-to-right day/hour/minute/second order. */
export function AchievementCountdown({
  compact = false,
  neutral = false,
  releaseAt = STUDENT_FUTURE_FEATURE_RELEASE_AT,
  ariaLabel = "زمان باقی‌مانده تا انتشار دستاوردها؛ روز، ساعت، دقیقه، ثانیه",
}: {
  compact?: boolean;
  /** Use the surrounding surface instead of the dark promotional countdown treatment. */
  neutral?: boolean;
  releaseAt?: number;
  ariaLabel?: string;
}) {
  const [remaining, setRemaining] = useState(() => remainingTime(releaseAt));

  useEffect(() => {
    setRemaining(remainingTime(releaseAt));
    const timer = window.setInterval(() => setRemaining(remainingTime(releaseAt)), 1_000);
    return () => window.clearInterval(timer);
  }, [releaseAt]);

  const units = [
    [remaining.days, "روز"],
    [remaining.hours, "ساعت"],
    [remaining.minutes, "دقیقه"],
    [remaining.seconds, "ثانیه"],
  ] as const;

  return (
    <div
      dir="ltr"
      className={`grid grid-cols-4 gap-2 ${compact ? "w-full" : "mx-auto mt-5 max-w-md"}`}
      role="timer"
      aria-label={ariaLabel}
    >
      {units.map(([value, label]) => (
        <div
          key={label}
          dir="rtl"
          className={`rounded-lg border px-1 text-center ${
            neutral
              ? "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] text-ink"
              : "border-white/15 bg-white/10"
          } ${compact ? "py-1" : "py-3"}`}
        >
          <strong
            className={`block font-black tabular-nums ${compact ? "text-sm" : "text-xl sm:text-2xl"}`}
          >
            {twoDigits(value)}
          </strong>
          <span
            className={`mt-0.5 block text-[9px] font-bold ${
              neutral ? "text-slate-500 dark:text-slate-300" : "text-slate-300"
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
