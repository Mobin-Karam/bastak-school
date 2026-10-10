import { Sunrise, Sun, SunMedium, SunDim, Sunset, MoonStar } from "lucide-react";

import { useDevicePerformance } from "../../../app/layout/shell/use-device-performance";
import { fa } from "../../../shared/lib/utils";
import { useCurrentPrayer } from "../hooks/use-current-prayer";
import type { PrayerSchedule } from "../model/current-prayer";

type CurrentPrayerCardProps = {
  times: PrayerSchedule | null | undefined;
  className?: string;
};

function PrayerIcon({ label }: { label: string }) {
  const normalized = label.trim().toLowerCase();
  const props = { "aria-hidden": true, size: 26, strokeWidth: 1.9, className: "relative" } as const;
  if (["fajr", "صبح", "فجر"].includes(normalized)) return <Sunrise {...props} />;
  if (["sunrise", "طلوع آفتاب", "طلوع"].includes(normalized)) return <Sun {...props} />;
  if (["dhuhr", "ظهر"].includes(normalized)) return <SunMedium {...props} />;
  if (["asr", "عصر"].includes(normalized)) return <SunDim {...props} />;
  if (["maghrib", "مغرب"].includes(normalized)) return <Sunset {...props} />;
  if (["isha", "عشاء", "عشا"].includes(normalized)) return <MoonStar {...props} />;
  return <SunMedium {...props} />;
}

function normalizePrayerTime(time: string) {
  return time
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function isValidPrayerTime(time: unknown): time is string {
  if (typeof time !== "string") return false;

  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(normalizePrayerTime(time.trim()));

  return Boolean(match);
}

/** Shared live prayer moment for every role dashboard. */
export function CurrentPrayerCard({ times, className = "" }: CurrentPrayerCardProps) {
  const active = useCurrentPrayer(times);
  const performance = useDevicePerformance();

  if (
    !active ||
    typeof active.label !== "string" ||
    !active.label.trim() ||
    !isValidPrayerTime(active.time)
  ) {
    return null;
  }

  const enhancedEffects = performance === "enhanced";
  // Keep the ISO-like source value for the machine-readable attribute, while
  // giving Persian readers a clock with Persian numerals.
  const displayTime = fa(active.time.trim());
  const machineTime = normalizePrayerTime(active.time.trim());

  return (
    <section aria-label="اوقات شرعی" aria-live="polite">
      <div
        dir="rtl"
        role="group"
        aria-label="اوقات شرعی"
        className={[
          "relative isolate min-w-0 overflow-hidden rounded-[1.35rem] max-md:-mx-4 max-md:w-[calc(100%+2rem)] max-md:rounded-none",
          "border border-teal-200/85 max-md:border-x-0 bg-[linear-gradient(135deg,#fdfdf8_0%,#e6f8f3_58%,#d9f4ed_100%)]",
          "p-3.5 shadow-[0_14px_26px_-20px_rgba(11,82,75,.70),inset_0_1px_0_rgba(255,255,255,.98),inset_0_-3px_0_rgba(13,148,136,.10)]",
          "dark:border-teal-400/15 dark:bg-[linear-gradient(135deg,#123e40_0%,#0c3234_58%,#0a282b_100%)] dark:shadow-[0_18px_30px_-22px_rgba(0,0,0,.95),inset_0_1px_0_rgba(255,255,255,.10)]",
          "transition-[transform,box-shadow] duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_20px_30px_-20px_rgba(11,82,75,.62),inset_0_1px_0_rgba(255,255,255,.98)] motion-reduce:transition-none",
          className,
        ].join(" ")}
      >
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute -end-8 -top-10 size-32 rounded-full bg-[#e7b74b]/25 blur-2xl",
            enhancedEffects
              ? "motion-safe:animate-pulse motion-safe:[animation-duration:3.6s] motion-reduce:animate-none"
              : "",
          ].join(" ")}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-5 top-0 h-px bg-white/90 dark:bg-white/20"
        />

        <div className="relative flex min-w-0 items-center gap-3">
          <div className="relative grid size-12 shrink-0 place-items-center rounded-2xl border border-white/70 bg-[linear-gradient(145deg,#0f9b8e,#08756e)] text-white shadow-[0_10px_18px_-10px_rgba(5,75,70,.9),inset_0_1px_0_rgba(255,255,255,.42),inset_0_-3px_0_rgba(0,68,64,.25)] sm:size-14">
            <span
              aria-hidden="true"
              className={[
                "absolute inset-1 rounded-[0.8rem] border border-white/20",
                enhancedEffects
                  ? "motion-safe:animate-pulse motion-safe:[animation-duration:2.8s] motion-reduce:animate-none"
                  : "",
              ].join(" ")}
            />
            <PrayerIcon label={active.label} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-wide text-teal-900/65 dark:text-teal-100/65">
              وقت شرعی {active.tomorrow ? "فردا" : "پیشِ رو"}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-black tracking-tight text-ink dark:text-white sm:text-xl">
              {active.label}
            </h2>
            <span className="mt-0.5 hidden text-[10px] font-bold text-teal-800/65 dark:text-teal-100/65 sm:block">
              براساس ساعت مدرسه
            </span>
          </div>

          <time
            dateTime={machineTime}
            dir="ltr"
            lang="fa"
            className="ms-auto shrink-0 rounded-2xl border border-white/80 bg-white/70 px-3 py-2 text-2xl font-black leading-none tabular-nums tracking-tight text-teal-900 shadow-[0_9px_16px_-12px_rgba(4,74,69,.85),inset_0_1px_0_rgba(255,255,255,.98),inset_0_-2px_0_rgba(13,148,136,.12)] dark:border-white/10 dark:bg-white/10 dark:text-teal-50 sm:px-4 sm:py-2.5 sm:text-3xl"
          >
            {displayTime}
          </time>
        </div>
      </div>
    </section>
  );
}
