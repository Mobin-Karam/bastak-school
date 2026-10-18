import { Bell, BellRing, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useAlarms } from "../hooks/useAlarms";
import { clockCopy, clockDays } from "../model/clock-copy";
import { useLocale } from "../../../shared/ui/locale";

export function AlarmPanel() {
  const { language } = useLocale();
  const copy = clockCopy[language];
  const days = clockDays[language];
  const { alarms, activeAlarm, addAlarm, toggleAlarm, removeAlarm, dismiss, snooze } = useAlarms();
  const [hour, setHour] = useState(() => new Date(Date.now() + 60_000).getHours());
  const [minute, setMinute] = useState(() => new Date(Date.now() + 60_000).getMinutes());
  const [label, setLabel] = useState(copy.alarm);
  const [repeatDays, setRepeatDays] = useState<number[]>([]);

  const active = activeAlarm ? alarms.find((alarm) => alarm.id === activeAlarm.alarmId) : undefined;

  const toggleDay = (day: number) =>
    setRepeatDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  const add = async () => {
    await addAlarm({ hour, minute, label, repeatDays, snoozeMinutes: 5 });
    setLabel(copy.alarm);
  };

  return (
    <div className="space-y-3">
      {active && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800/70 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <BellRing className="animate-pulse" size={18} />
            <strong className="text-xs">{active.label}</strong>
            <span dir="ltr" className="ms-auto font-mono text-sm font-black">
              {String(active.hour).padStart(2, "0")}:{String(active.minute).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => snooze()}
              className="h-9 flex-1 rounded-lg bg-amber-600 px-3 text-xs font-bold text-white hover:bg-amber-700"
            >
              {copy.snooze} {active.snoozeMinutes} {copy.minutes}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="h-9 flex-1 rounded-lg border border-amber-300 bg-white px-3 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
            >
              {copy.dismiss}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/70">
        <div className="flex items-center gap-2">
          <input
            aria-label={copy.hour}
            type="number"
            min={0}
            max={23}
            value={hour}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setHour(Math.min(23, Math.max(0, Number(event.target.value))))
            }
            className="h-10 w-16 rounded-lg border border-slate-200 bg-white px-2 text-center font-mono font-bold outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900"
          />
          <span className="font-bold text-slate-400">:</span>
          <input
            aria-label={copy.minute}
            type="number"
            min={0}
            max={59}
            value={minute}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setMinute(Math.min(59, Math.max(0, Number(event.target.value))))
            }
            className="h-10 w-16 rounded-lg border border-slate-200 bg-white px-2 text-center font-mono font-bold outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900"
          />
          <input
            value={label}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setLabel(event.target.value)}
            placeholder={copy.alarmTitle}
            className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={add}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-bold text-white hover:bg-brand-strong"
          >
            <Plus size={15} /> {copy.add}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{copy.repeat}</span>
          {days.map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => toggleDay(day.id)}
              className={`grid size-7 place-items-center rounded-full text-[10px] font-bold transition ${repeatDays.includes(day.id) ? "bg-brand text-white" : "bg-white text-slate-500 hover:text-brand dark:bg-slate-900 dark:text-slate-400"}`}
            >
              {day.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRepeatDays(repeatDays.length === 7 ? [] : days.map((day) => day.id))}
            className="ms-auto text-[9px] font-bold text-brand"
          >
            {repeatDays.length === 7 ? copy.clear : copy.everyDay}
          </button>
        </div>
      </div>

      {alarms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {copy.noAlarms}
        </div>
      ) : (
        <div className="max-h-56 space-y-2 overflow-y-auto pe-0.5">
          {alarms.map((alarm) => (
            <div
              key={alarm.id}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800"
            >
              <Bell size={15} className={alarm.enabled ? "text-brand" : "text-slate-400"} />
              <div className="min-w-0 flex-1">
                <div
                  dir="ltr"
                  className="font-mono text-sm font-black text-slate-800 dark:text-white"
                >
                  {String(alarm.hour).padStart(2, "0")}:{String(alarm.minute).padStart(2, "0")}
                </div>
                <div className="truncate text-[10px] text-slate-500 dark:text-slate-400">
                  {alarm.label}
                  {alarm.repeatDays.length
                    ? ` • ${alarm.repeatDays.length === 7 ? copy.everyDay : `${alarm.repeatDays.length} ${copy.daysPerWeek}`}`
                    : ` • ${copy.once}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleAlarm(alarm.id)}
                className={`h-7 rounded-full px-2 text-[10px] font-bold ${alarm.enabled ? "bg-brand/10 text-brand" : "bg-slate-100 text-slate-500 dark:bg-slate-700"}`}
              >
                {alarm.enabled ? copy.enabled : copy.disabled}
              </button>
              <button
                type="button"
                onClick={() => removeAlarm(alarm.id)}
                className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                aria-label={`${copy.deleteAlarm} ${alarm.label}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
