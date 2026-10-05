import type { ReactNode } from "react";
import { Activity, CalendarClock, LogIn, LogOut } from "lucide-react";
import { formatDateTime, formatDuration } from "../lib/time";
import type { PlatformSessionStats } from "../model/clock.types";
import { clockCopy } from "../model/clock-copy";
import { useLocale } from "../../../shared/ui/locale";

export function SessionStats({ stats }: { stats: PlatformSessionStats }) {
  const { language } = useLocale();
  const copy = clockCopy[language];
  return (
    <div className="grid grid-cols-2 gap-2">
      <Stat
        icon={<Activity size={15} />}
        label={copy.currentSession}
        value={formatDuration(stats.currentSessionMs)}
      />
      <Stat
        icon={<CalendarClock size={15} />}
        label={copy.today}
        value={formatDuration(stats.todayMs)}
      />
      <Stat
        icon={<LogIn size={15} />}
        label={copy.sessionStart}
        value={formatDateTime(stats.enteredAt)}
      />
      <Stat
        icon={<LogOut size={15} />}
        label={copy.lastExit}
        value={formatDateTime(stats.lastExitAt)}
      />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </div>
      <div className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{value}</div>
    </div>
  );
}
