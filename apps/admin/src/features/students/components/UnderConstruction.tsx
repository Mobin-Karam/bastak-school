import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../auth";
import { Button } from "../../../shared/ui/ui";

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
      className="relative flex min-h-[100dvh] w-full items-start justify-center overflow-x-hidden overflow-y-auto bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-white sm:items-center sm:py-10"
    >
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center text-center">
        {/* Status */}
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          در حال ساخت و توسعه
        </span>

        {/* Animated illustration */}
        <svg
          viewBox="0 0 400 280"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="انیمیشن ساخت ساختمان"
          className="h-auto w-full max-w-[270px] sm:max-w-[390px]"
        >
          <defs>
            <linearGradient id="buildingFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="glassFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#BFDBFE" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
          </defs>

          {/* Floating clouds */}
          <g fill="#94A3B8" opacity=".22">
            <g className="animate-[float_6s_ease-in-out_infinite]">
              <ellipse cx="82" cy="55" rx="30" ry="9" />
              <circle cx="72" cy="48" r="13" />
              <circle cx="94" cy="49" r="10" />
            </g>
            <g className="animate-[float_8s_ease-in-out_infinite_reverse]">
              <ellipse cx="325" cy="78" rx="27" ry="8" />
              <circle cx="316" cy="72" r="11" />
            </g>
          </g>

          {/* Ground */}
          <ellipse cx="198" cy="250" rx="150" ry="9" fill="#64748B" opacity=".12" />
          <path
            d="M40 242H360"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".4"
          />

          {/* Building */}
          <g className="animate-[riseIn_1.3s_ease-out_both]">
            <rect x="105" y="105" width="186" height="135" rx="5" fill="url(#buildingFill)" />
            <path d="M105 105H291V125H105Z" fill="#1E40AF" opacity=".45" />
            <rect x="96" y="99" width="204" height="10" rx="3" fill="#1D4ED8" />

            {/* Windows */}
            {Array.from({ length: 3 }).map((_, row) =>
              Array.from({ length: 4 }).map((_, col) => (
                <g key={`${row}-${col}`}>
                  <rect
                    x={121 + col * 43}
                    y={130 + row * 34}
                    width="25"
                    height="23"
                    rx="3"
                    fill="url(#glassFill)"
                    className="animate-[windowGlow_3s_ease-in-out_infinite]"
                    style={{ animationDelay: `${(row + col) * 0.25}s` }}
                  />
                  <path
                    d={`M${133.5 + col * 43} ${130 + row * 34}v23`}
                    stroke="#2563EB"
                    opacity=".5"
                  />
                </g>
              )),
            )}

            {/* Door */}
            <rect x="178" y="209" width="39" height="31" rx="3" fill="#1E3A8A" />
            <path d="M197.5 210V240" stroke="#60A5FA" opacity=".6" />
            <circle cx="192" cy="227" r="2" fill="#F59E0B" />

            {/* Side details */}
            <path d="M112 111V240" stroke="#93C5FD" strokeWidth="2" opacity=".35" />
          </g>

          {/* Crane */}
          <g stroke="#F59E0B" strokeLinecap="round" strokeLinejoin="round">
            <path d="M321 242V40" strokeWidth="7" />
            <path d="M321 42H382" strokeWidth="7" />
            <path d="M321 42H234" strokeWidth="7" />
            <path d="M321 42L279 17L234 42" fill="none" strokeWidth="4" />
            <path d="M321 42L382 18V42" fill="none" strokeWidth="4" />

            {/* Crane support crossbars */}
            {[85, 125, 165, 205].map((y) => (
              <g key={y} strokeWidth="2.5" opacity=".65">
                <path d={`M318 ${y}l6 36M324 ${y}l-6 36`} />
              </g>
            ))}
          </g>

          {/* Animated hanging cable and load */}
          <g className="animate-[lift_4s_ease-in-out_infinite]">
            <path d="M250 42V112" stroke="#64748B" strokeWidth="2.5" strokeDasharray="5 3" />
            <path d="M250 112v9" stroke="#475569" strokeWidth="3" />
            <path d="M239 121l11 10 11-10" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
            <rect x="229" y="131" width="42" height="25" rx="3" fill="#F59E0B" />
            <path d="M232 139H268M232 147H268" stroke="#FDE68A" strokeWidth="2" opacity=".7" />
          </g>

          {/* Construction barriers */}
          <g>
            <rect x="55" y="224" width="49" height="20" rx="3" fill="#F59E0B" />
            <path
              d="M64 224l-10 20M82 224l-10 20M100 224l-10 20"
              stroke="white"
              strokeWidth="5"
              opacity=".85"
            />
            <rect x="60" y="244" width="4" height="9" fill="#64748B" />
            <rect x="95" y="244" width="4" height="9" fill="#64748B" />
          </g>

          {/* Sparkles */}
          {[
            [65, 132],
            [340, 120],
            [75, 190],
          ].map(([x, y], i) => (
            <g
              key={i}
              className="animate-[sparkle_2s_ease-in-out_infinite]"
              style={{
                animationDelay: `${i * 0.7}s`,
              }}
            >
              <path
                d={`M${x} ${y - 7}v14M${x - 7} ${y}h14`}
                stroke="#059669"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          ))}
        </svg>

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
