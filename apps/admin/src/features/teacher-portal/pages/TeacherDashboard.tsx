import { TimetableToday } from "../../schedule";
import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, CalendarClock, ChevronLeft, Clock3, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth";
import { listSchedule, type ScheduleEntry } from "../../schedule/api/schedule.api";
import { listClasses } from "../../education/api/classes.api";
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
  // The API limits this list to classes where the current teacher is assigned
  // to at least one class book. Books are displayed from that same scoped
  // response; the client never selects a teacher or class by itself.
  const classes = useQuery({
    queryKey: ["classes", "teacher"],
    queryFn: () => listClasses(auth.context?.activeOrganization?.id),
    enabled: auth.can("classes.read"),
  });
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
      <TimetableToday />

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

      <section aria-labelledby="teacher-classes-title" className="grid gap-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <h2 id="teacher-classes-title" className="text-sm font-black text-ink">
              کلاس‌ها و کتاب‌های من
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              فقط کلاس‌ها و کتاب‌هایی که به شما واگذار شده‌اند.
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand"
            to="/admin/schedule"
          >
            برنامه هفتگی <ChevronLeft size={15} aria-hidden="true" />
          </Link>
        </div>
        {classes.isLoading ? (
          <LoadingState label="در حال دریافت کلاس‌ها و کتاب‌های شما…" />
        ) : classes.isError ? (
          <EmptyState title="کلاس‌ها و کتاب‌های شما دریافت نشد." />
        ) : classes.data?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 min-[1200px]:grid-cols-3">
            {classes.data.map((classroom) => (
              <Card key={classroom.id} className="min-w-0 p-3">
                <div className="flex items-start gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                    <UsersRound size={17} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-ink">{classroom.name}</h3>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {classroom.enrollmentCount.toLocaleString("fa-IR")} دانش‌آموز
                    </p>
                  </div>
                </div>
                <ul className="mt-3 grid gap-1.5" aria-label={`کتاب‌های ${classroom.name}`}>
                  {classroom.books.map((book) => (
                    <li
                      key={book.id}
                      className="flex min-w-0 items-center gap-1.5 rounded-lg bg-[rgb(var(--surface-muted))] px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200"
                    >
                      <BookOpenCheck size={14} className="shrink-0 text-brand" aria-hidden="true" />
                      <span className="truncate font-bold">{book.title}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="هنوز کلاس یا کتابی به شما واگذار نشده است." />
        )}
      </section>

      <TeacherClassAttendanceSheet
        entry={selectedClass}
        open={Boolean(selectedClass)}
        onOpenChange={(open) => !open && setSelectedClass(null)}
        canManage={auth.can("attendance.manage")}
      />
    </section>
  );
}
