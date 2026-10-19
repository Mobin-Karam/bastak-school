import { useEffect, useState } from "react";

const RELEASE_AT = new Date("2026-11-08T23:59:59+03:30").getTime();

function remainingTime() {
  const seconds = Math.max(0, Math.floor((RELEASE_AT - Date.now()) / 1_000));
  return {
    days: Math.floor(seconds / 86_400),
    hours: Math.floor((seconds % 86_400) / 3_600),
    minutes: Math.floor((seconds % 3_600) / 60),
    seconds: seconds % 60,
  };
}

const twoDigits = (value: number) => value.toLocaleString("fa-IR", { minimumIntegerDigits: 2 });

/** Release clock rendered in the intentional left-to-right day/hour/minute/second order. */
export function AchievementCountdown({ compact = false }: { compact?: boolean }) {
  const [remaining, setRemaining] = useState(remainingTime);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(remainingTime()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

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
      aria-label="زمان باقی‌مانده تا انتشار دستاوردها؛ روز، ساعت، دقیقه، ثانیه"
    >
      {units.map(([value, label]) => (
        <div
          key={label}
          dir="rtl"
          className={`rounded-2xl border border-white/15 bg-white/10 px-1 text-center ${compact ? "py-2" : "py-3"}`}
        >
          <strong
            className={`block font-black tabular-nums ${compact ? "text-sm" : "text-xl sm:text-2xl"}`}
          >
            {twoDigits(value)}
          </strong>
          <span className="mt-1 block text-[10px] font-bold text-slate-300">{label}</span>
        </div>
      ))}
    </div>
  );
}
