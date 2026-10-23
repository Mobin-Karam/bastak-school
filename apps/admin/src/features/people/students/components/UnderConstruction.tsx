import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../../identity/auth";
import { Button } from "../../../../shared/ui/ui";
import { brand } from "../../../../app/config/brand";
import ConstructionScene from "./ConstructionScene";
import RollingNumber from "./RollingNumber";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getCountdown(endTime: number): Countdown {
  const remaining = Math.max(0, endTime - Date.now());
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
}

export default function UnderConstruction({ endTime }: { endTime: number }) {
  const auth = useAuth();
  const [time, setTime] = useState<Countdown>(() => getCountdown(endTime));

  useEffect(() => {
    setTime(getCountdown(endTime));
    const timer = window.setInterval(() => setTime(getCountdown(endTime)), 1000);
    return () => window.clearInterval(timer);
  }, [endTime]);

  const finished = Object.values(time).every((value) => value === 0);
  const units = [
    { key: "seconds", label: "ثانیه", value: time.seconds },
    { key: "minutes", label: "دقیقه", value: time.minutes },
    { key: "hours", label: "ساعت", value: time.hours },
    { key: "days", label: "روز", value: time.days },
  ];

  return (
    <main
      dir="rtl"
      className="relative isolate min-h-[100svh] min-h-[100dvh] w-full overflow-x-hidden bg-[#f6f8fc] text-slate-900 dark:bg-[#080f1f] dark:text-slate-50"
    >
      {/* Low-cost ambient background; never blocks controls */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-28 -top-24 size-72 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-600/10" />
        <div className="absolute -bottom-32 -left-24 size-80 rounded-full bg-emerald-400/10 blur-3xl dark:bg-teal-500/10" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#1e40af_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-[0.07]" />
      </div>

      {/* Use scrolling, not scale(), so small phones and landscape don't clip the button. */}
      <div className="relative z-10 flex min-h-[100svh] min-h-[100dvh] items-center justify-center px-3 py-6 sm:px-6 sm:py-10">
        <section
          aria-labelledby="construction-title"
          className="relative w-full max-w-[780px] rounded-[28px] bg-white/80 shadow-[0_16px_65px_-28px_rgba(15,23,42,0.28)] ring-1 ring-slate-200/70 backdrop-blur-xl dark:bg-slate-900/75 dark:ring-slate-700/70 sm:rounded-[34px]"
        >
          {/* Static border for accessibility and an SVG perimeter runner above it. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px] sm:rounded-[34px]"
          >
            <svg
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <rect
                x="0.55"
                y="0.55"
                width="98.9"
                height="98.9"
                rx="4"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="currentColor"
                strokeWidth="1"
                className="text-blue-500/20 dark:text-cyan-400/20"
              />
              <rect
                x="0.55"
                y="0.55"
                width="98.9"
                height="98.9"
                rx="4"
                pathLength="100"
                fill="none"
                vectorEffect="non-scaling-stroke"
                stroke="url(#construction-border-glow)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="12 88"
                className="uc-border-runner"
              />
              <defs>
                <linearGradient id="construction-border-glow" x1="0" y1="0" x2="1" y2="1">
                  <stop stopColor="#059669" />
                  <stop offset="0.5" stopColor="#22d3ee" />
                  <stop offset="1" stopColor="#2563eb" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* This chip visually interrupts the top border like a sign on a frame. */}
          <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-amber-300/70 bg-amber-50 px-4 py-2 shadow-sm dark:border-amber-500/30 dark:bg-[#1b2130]">
            <span className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-normal text-amber-700 dark:text-amber-300 sm:text-xs">
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-amber-500 motion-reduce:animate-none" />
              در حال ساخت و ساز
            </span>
          </div>

          <div className="relative flex flex-col items-center px-4 pb-6 pt-9 text-center sm:px-10 sm:pb-9 sm:pt-11">
            <div className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="h-px w-5 bg-emerald-400/60" />
              سامانه مدیریت مدرسه سلطان العلماء بستک
              <span className="h-px w-5 bg-emerald-400/60" />
            </div>

            {/* Full scene stays visible and scales within its 760:390 aspect ratio. */}
            <div className="relative w-full max-w-[680px] overflow-hidden rounded-2xl bg-gradient-to-b from-sky-50/50 to-transparent dark:from-slate-800/20">
              <ConstructionScene />
            </div>

            <h1
              id="construction-title"
              className="mt-4 max-w-lg text-balance text-[19px] font-extrabold leading-[1.9] tracking-tight sm:mt-5 sm:text-[28px]"
            >
              این بخش در حال آماده‌سازی است
            </h1>
            <p className="mt-1 max-w-[450px] text-pretty text-[12px] leading-7 text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-sm sm:leading-8">
              در حال ساخت امکانات جدید برای شما هستیم. از شکیبایی شما سپاسگزاریم؛ به‌زودی با
              تجربه‌ای بهتر بازمی‌گردیم.
            </p>

            <div className="mt-5 w-full max-w-[420px] sm:mt-7">
              <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {finished ? "زمان پیش‌بینی‌شده به پایان رسیده است" : "زمان باقی‌مانده تا رونمایی"}
              </div>

              {/* English digital values with Persian labels. dir=ltr fixes mobile ordering. */}

              <div className="grid grid-cols-4 gap-2 sm:gap-3" dir="rtl" aria-label="شمارش معکوس">
                {units.map((unit) => (
                  <RollingNumber key={unit.key} value={unit.value} label={unit.label} />
                ))}
              </div>
            </div>

            <Button
              variant="soft"
              className="mt-5 flex min-h-11 w-full max-w-[420px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 sm:mt-7"
              loading={auth.status === "logging-out"}
              onClick={() => void auth.logout()}
            >
              <LogOut size={17} aria-hidden="true" />
              خروج از حساب و بازگشت به ورود
            </Button>

            <p className="mt-5 text-center text-[10px] leading-6 text-slate-400 dark:text-slate-500 sm:text-xs">
              {brand.name.fa}
            </p>
          </div>
        </section>
      </div>

      <style>{`
        .uc-border-runner { animation: uc-perimeter 7s linear infinite; }
        @keyframes uc-perimeter { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -100; } }
        @media (prefers-reduced-motion: reduce) { .uc-border-runner { animation: none; stroke-dasharray: 100 0; } }
      `}</style>
    </main>
  );
}
