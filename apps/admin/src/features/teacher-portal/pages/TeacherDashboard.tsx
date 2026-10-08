import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronLeft, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth";
import { listSchedule, type ScheduleEntry } from "../../schedule/api/schedule.api";
import { todayIso } from "../../../shared/lib/utils";
import { useLocale } from "../../../shared/ui/locale";
import { Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { getAdminDashboard } from "../../dashboard/api/dashboard.api";
import { DashboardCalendar } from "../../dashboard/components/DashboardCalendar";
import { AnnouncementEnvelope } from "../../dashboard/components/AnnouncementEnvelope";
import { CurrentPrayerCard } from "../../school-home/components/CurrentPrayerCard";
import { TeacherClassAttendanceSheet } from "../components/TeacherClassAttendanceSheet";

/** The teacher's class-first home; schedule and roster data remain server-scoped. */
export function TeacherDashboard() {
  const auth = useAuth();
  const { formatDate } = useLocale();
  const [calendarDate, setCalendarDate] = useState(todayIso);
  const [selectedClass, setSelectedClass] = useState<ScheduleEntry | null>(null);
  const home = useQuery({
    queryKey: ["dashboard", "teacher-home"],
    queryFn: () => getAdminDashboard("TEACHER"),
  });
  const schedule = useQuery({ queryKey: ["schedule", "teacher"], queryFn: listSchedule });
  const weekday = new Date(`${calendarDate}T12:00:00`).getDay();
  const classesToday = useMemo(
    () =>
      (schedule.data ?? []).filter(
        (entry) => entry.status === "ACTIVE" && entry.weekday === weekday,
      ),
    [schedule.data, weekday],
  );
  const prayer = home.data?.home?.prayer;
  const prayerTimes = prayer && "times" in prayer ? prayer.times : null;
  // The home payload intentionally contains a lean calendar record. Resolve it
  // against the schedule query before opening attendance so organization and
  // classroom identifiers never come from an untrusted UI value.
  const homeCurrentClass = home.data?.home?.currentClass;
  const currentClass =
    (homeCurrentClass
      ? (schedule.data ?? []).find((entry) => entry.id === homeCurrentClass.id)
      : undefined) ??
    classesToday[0] ??
    null;

  if (schedule.isLoading && home.isLoading)
    return <LoadingState label="در حال آماده‌سازی میز استاد…" />;

  return (
    <section
      className="mx-auto grid w-full max-w-6xl gap-3 lg:content-start"
      aria-label="خانه استاد"
    >
      <header className="flex items-baseline justify-between gap-3 px-1 pt-1">
        <h1 className="text-base font-black tracking-tight text-ink sm:text-lg">امروز در مدرسه</h1>
        <span className="text-xs text-slate-500">
          {formatDate(calendarDate, { dateStyle: "medium" })}
        </span>
      </header>

      <DashboardCalendar
        value={calendarDate}
        onChange={setCalendarDate}
        capabilities={auth.capabilities}
        schedule={schedule.data ?? []}
      />

      <AnnouncementEnvelope announcements={home.data?.home?.announcements} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="col-span-2 min-w-0 p-3 sm:col-span-1" aria-label="کلاس جاری">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
                <CalendarClock size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-black text-ink">کلاس جاری</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">فهرست و حضور دانش‌آموزان</p>
              </div>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-xs font-bold text-brand"
              to="/admin/schedule"
            >
              برنامه کامل <ChevronLeft size={15} aria-hidden="true" />
            </Link>
          </div>
          {currentClass ? (
            <button
              type="button"
              onClick={() => setSelectedClass(currentClass)}
              className="mt-3 flex w-full items-center gap-2 rounded-xl bg-[rgb(var(--surface-muted))] p-3 text-right outline-none transition hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none"
              aria-label={`باز کردن فهرست ${currentClass.title}`}
            >
              <Clock3 size={17} className="shrink-0 text-brand" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{currentClass.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {currentClass.startTime} تا {currentClass.endTime}
                  {currentClass.room ? ` · ${currentClass.room}` : ""}
                </p>
              </div>
            </button>
          ) : (
            <EmptyState title="امروز کلاسی ندارید." />
          )}
        </Card>

        <CurrentPrayerCard times={prayerTimes} />
      </div>

      <TeacherClassAttendanceSheet
        entry={selectedClass}
        open={Boolean(selectedClass)}
        onOpenChange={(open) => !open && setSelectedClass(null)}
        canManage={auth.can("attendance.manage")}
      />
    </section>
  );
}
