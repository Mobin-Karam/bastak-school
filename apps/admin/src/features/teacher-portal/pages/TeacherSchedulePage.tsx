import { CalendarClock, MapPin, UsersRound } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../auth";
import type { ScheduleEntry } from "../../schedule/api/schedule.api";
import { Card, EmptyState } from "../../../shared/ui/ui";
import { TeacherClassAttendanceSheet } from "../components/TeacherClassAttendanceSheet";

const weekdays = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

/** A read-only weekly timetable for teachers, with roster access per assigned class. */
export function TeacherSchedulePage({ entries }: { entries: ScheduleEntry[] }) {
  const auth = useAuth();
  const [selectedClass, setSelectedClass] = useState<ScheduleEntry | null>(null);
  const active = entries.filter((entry) => entry.status === "ACTIVE");

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4" dir="rtl">
      <header className="flex items-start gap-3 px-1 pt-1">
        <span className="grid size-10 place-items-center rounded-2xl bg-brand/10 text-brand">
          <CalendarClock size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-lg font-black text-ink">برنامه هفتگی من</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            برای دیدن دانش‌آموزان و ثبت حضور، یک کلاس را انتخاب کنید.
          </p>
        </div>
      </header>
      {!active.length ? (
        <EmptyState title="کلاسی در برنامه شما ثبت نشده است." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {weekdays.map((day, weekday) => {
            const dayEntries = active.filter((entry) => entry.weekday === weekday);
            return (
              <Card key={day} className="min-w-0 p-3">
                <h2 className="text-sm font-black text-ink">{day}</h2>
                {dayEntries.length ? (
                  <ul className="mt-3 grid gap-2">
                    {dayEntries.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedClass(entry)}
                          className="w-full rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3 text-right outline-none transition hover:border-brand/40 hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-ink">{entry.title}</p>
                            <span className="shrink-0 text-xs font-bold text-brand">
                              {entry.startTime}
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={13} aria-hidden="true" />
                            {entry.room || entry.classroom?.name || "محل ثبت نشده"}
                          </p>
                          <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand">
                            <UsersRound size={13} aria-hidden="true" />
                            فهرست کلاس و حضور
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 rounded-xl bg-[rgb(var(--surface-muted))] px-3 py-4 text-center text-xs text-slate-500">
                    کلاسی ندارید
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <TeacherClassAttendanceSheet
        entry={selectedClass}
        open={Boolean(selectedClass)}
        onOpenChange={(open) => !open && setSelectedClass(null)}
        canManage={auth.can("attendance.manage")}
      />
    </section>
  );
}
