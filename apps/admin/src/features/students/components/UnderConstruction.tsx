import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../auth";
import { Button } from "../../../shared/ui/ui";
import ConstructionScene from "./ConstructionScene";

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getCountdown(endTime: number): Countdown {
  const remaining = Math.max(0, endTime - Date.now());

  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining / 3600000) % 24),
    minutes: Math.floor((remaining / 60000) % 60),
    seconds: Math.floor((remaining / 1000) % 60),
  };
}

export default function UnderConstruction({ endTime }: { endTime: number }) {
  const auth = useAuth();
  // The deadline is supplied by the app-level maintenance configuration, so every
  // signed-in user sees the same countdown instead of a browser-local timer.
  const deadline = endTime;

  const [time, setTime] = useState(() => getCountdown(deadline));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTime(getCountdown(deadline));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [deadline]);

  const units = [
    { label: "ثانیه", value: time.seconds },
    { label: "دقیقه", value: time.minutes },
    { label: "ساعت", value: time.hours },
    { label: "روز", value: time.days },
  ];

  const finished = Object.values(time).every((v) => v === 0);

  return (
    <main
      dir="rtl"
      className="relative flex h-[100svh] h-[100dvh] w-full items-center justify-center overflow-hidden bg-slate-50 px-4 py-4 text-slate-900 dark:bg-slate-950 dark:text-white sm:py-6"
    >
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center text-center [@media(max-height:700px)]:scale-90 [@media(max-height:560px)]:scale-75">
        {/* Status */}
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          در حال ساخت و توسعه
        </span>

        {/* Animated illustration */}
        <ConstructionScene />

        {/* Persian content */}
        <h1 className="mt-2 text-xl font-bold leading-9 tracking-tight sm:text-3xl sm:leading-[1.7]">
          در حال ساخت و ساز، فعلاً نمی‌توانید وارد شوید.
        </h1>

        <p className="mt-4 max-w-md text-sm leading-8 text-slate-500 dark:text-slate-400 sm:text-base">
          ما در حال آماده‌سازی امکانات جدید برای شما هستیم.
          <br />
          لطفاً صبور باشید، به‌زودی با تجربه‌ای بهتر برمی‌گردیم.
        </p>

        {/* Countdown */}

        <div className="mt-6 w-full max-w-sm sm:mt-8" aria-live="polite">
          <p className="mb-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
            {finished ? "زمان پیش‌بینی‌شده به پایان رسید" : "زمان باقی‌مانده تا رونمایی"}
          </p>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-3" dir="rtl">
            {units.map((unit) => (
              <div
                key={unit.label}
                className="group relative flex min-w-0 flex-col items-center gap-2 overflow-hidden rounded-xl border border-blue-500/20 bg-slate-950 px-1 py-3 shadow-[0_4px_20px_rgba(37,99,235,0.10)] transition-all duration-300 hover:border-blue-400/50 hover:shadow-[0_0_25px_rgba(37,99,235,0.20)] sm:gap-3 sm:py-4"
              >
                {/* Top glowing line */}
                <div className="absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/70 to-transparent" />

                {/* Robotic English numbers */}
                <span
                  dir="ltr"
                  className="font-[Vazirmatn] text-xl font-extrabold tabular-nums tracking-normal text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.35)] sm:text-3xl"
                >
                  {String(unit.value).padStart(2, "0")}
                </span>

                {/* Persian label */}
                <span className="text-[10px] font-medium text-slate-400 sm:text-[11px]">
                  {unit.label}
                </span>

                {/* Bottom indicator */}
                <div className="absolute bottom-0 h-[2px] w-8 rounded-full bg-cyan-500/40 transition-all group-hover:w-12 group-hover:bg-cyan-400" />
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="soft"
          className="mt-6 w-full max-w-sm dark:border-slate-700 dark:bg-slate-900"
          loading={auth.status === "logging-out"}
          onClick={() => void auth.logout()}
        >
          <LogOut size={17} aria-hidden="true" />
          خروج از حساب و بازگشت به ورود
        </Button>

        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 sm:mt-8">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          پلتفرم سلطان العلماء بستک | سامانه مدیریت مدرسه
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(12px); }
        }
        @keyframes riseIn {
          from { transform: translateY(35px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes lift {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-28px); }
        }
        @keyframes windowGlow {
          0%, 100% { opacity: .75; }
          50% { opacity: 1; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: .2; transform: scale(.8); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          svg * { animation: none !important; }
        }
      `}</style>
    </main>
  );
}
