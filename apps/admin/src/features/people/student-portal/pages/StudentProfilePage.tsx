import { useQuery } from "@tanstack/react-query";
import { Gamepad2, HelpCircle, UserRound } from "lucide-react";
import { useAuth } from "../../../identity/auth";
import { getAttendanceEncouragement } from "../../../student-life/attendance/public";
import { getAccountProfile } from "../../../platform/settings/api/settings.api";
import { AttendanceCoin } from "../../../../shared/ui/attendance-coin";
import { Card } from "../../../../shared/ui/ui";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

/** Student-only profile hub; uses scoped account and attendance data, never placeholder progress. */
export function StudentProfilePage() {
  const auth = useAuth();
  const profile = useQuery({ queryKey: ["account", "profile"], queryFn: getAccountProfile });
  const attendance = useQuery({
    queryKey: ["attendance-encouragement", auth.user?.id, auth.activeRole],
    queryFn: getAttendanceEncouragement,
    enabled: auth.can("attendance.self.read"),
  });
  const name =
    auth.user?.displayName || auth.user?.display_name || auth.user?.username || "دانش‌آموز";
  const total = attendance.data?.totalSessions ?? 0;
  const present = attendance.data?.present ?? 0;
  const rate = total ? Math.round((present / total) * 100) : 0;
  const late = attendance.data?.late ?? 0;
  const excused = attendance.data?.excused ?? 0;
  const points = (attendance.data as { points?: number } | undefined)?.points ?? 0;
  const radarData = [
    { metric: "حضور", value: rate },
    {
      metric: "به‌موقع",
      value: total ? Math.max(0, Math.round(((present - late) / total) * 100)) : 0,
    },
    { metric: "موجه", value: total ? Math.round((excused / total) * 100) : 0 },
    { metric: "تداوم", value: total ? Math.min(100, Math.round((total / 20) * 100)) : 0 },
  ];

  return (
    <section
      className="mx-auto grid w-full max-w-2xl gap-4 pb-24"
      dir="rtl"
      aria-label="پروفایل دانش‌آموز"
    >
      <Card className="relative overflow-hidden bg-gradient-to-bl from-indigo-700 via-violet-700 to-fuchsia-700 p-5 text-white">
        <span
          className="absolute -end-10 -top-10 size-40 rounded-full bg-cyan-300/25 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-center gap-4">
          <span className="grid size-24 shrink-0 place-items-center rounded-[2rem] border border-white/30 bg-white/15 shadow-xl">
            <UserRound size={58} strokeWidth={1.5} aria-label="تصویر پیش‌فرض دانش‌آموز" />
          </span>
          <div className="min-w-0 text-start">
            <h1 className="truncate text-xl font-black">{name}</h1>
            <p className="mt-1 text-xs text-white/80">
              {profile.data?.phoneNumber || "شماره همراه ثبت نشده"}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2">
              <AttendanceCoin className="size-6 object-contain" />
              <strong className="text-lg tabular-nums">{points.toLocaleString("fa-IR")}</strong>
              <span className="text-[11px] text-white/80">سکه</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="min-w-0">
          <h2 className="font-black text-ink">وضعیت حضور فعلی</h2>
          <p className="mt-1 text-sm text-slate-500">
            {present.toLocaleString("fa-IR")} حضور از {total.toLocaleString("fa-IR")} جلسه ثبت‌شده
          </p>
        </div>
        <div className="mt-2 h-56" dir="ltr" aria-label="نمودار راداری وضعیت حضور">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="68%">
              <PolarGrid stroke="var(--chart-grid, #cbd5e1)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "currentColor", fontSize: 11 }} />
              <Radar dataKey="value" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <DisabledFuture label="بازی‌ها" icon={Gamepad2} />
        <DisabledFuture label="آزمونک‌ها" icon={HelpCircle} />
      </div>
    </section>
  );
}

function DisabledFuture({ label, icon: Icon }: { label: string; icon: typeof Gamepad2 }) {
  return (
    <button
      type="button"
      disabled
      className="grid min-h-28 place-items-center gap-2 rounded-3xl border border-slate-200 bg-slate-100 p-4 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500"
    >
      <Icon size={25} aria-hidden="true" />
      <span className="text-sm font-black">{label}</span>
      <span className="text-[10px]">تا ۹۰ روز دیگر</span>
    </button>
  );
}
