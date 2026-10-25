import { useQuery } from "@tanstack/react-query";
import { BookOpenCheck, CalendarClock, ChevronLeft, Clock3, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../identity/auth";
import { listSchedule, type ScheduleEntry } from "../../../academics/schedule/api/schedule.api";
import { listClasses } from "../../../academics/education/api/classes.api";
import { todayIso } from "../../../../shared/lib/utils";
import { useLocale } from "../../../../shared/ui/locale";
import { Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { getAdminDashboard } from "../../../analytics/dashboard/api/dashboard.api";
import { AnnouncementEnvelope } from "../../../analytics/dashboard/components/AnnouncementEnvelope";
import { CurrentPrayerCard } from "../../../analytics/school-home/components/CurrentPrayerCard";
import { TeacherClassAttendanceSheet } from "../components/TeacherClassAttendanceSheet";

function tehranClockMinutes(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return value("hour") * 60 + value("minute");
}

function clockMinutes(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * 60 + Number(minute);
}

/** The teacher's class-first home; schedule and roster data remain server-scoped. */
export function TeacherDashboard() {
  const auth = useAuth();
  const { formatDate } = useLocale();
  const [now, setNow] = useState(() => new Date());
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
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const prayer = home.data?.home?.prayer;
  const prayerTimes = prayer && "times" in prayer ? prayer.times : null;
  // The home payload intentionally contains a lean calendar record. Resolve it
  // against the schedule query before opening attendance so organization and
  // classroom identifiers never come from an untrusted UI value.
  const todayEntries = useMemo(
    () =>
      (schedule.data ?? []).filter(
        (entry) =>
          entry.status === "ACTIVE" &&
          entry.weekday === new Date(`${todayIso()}T12:00:00`).getDay(),
      ),
    [schedule.data],
  );
  const currentMinute = tehranClockMinutes(now);
  const currentClass =
    todayEntries.find(
      (entry) =>
        currentMinute >= clockMinutes(entry.startTime) &&
        currentMinute < clockMinutes(entry.endTime),
    ) ?? null;

  if (schedule.isLoading && home.isLoading)
    return <LoadingState label="در حال آماده‌سازی میز استاد…" />;

  return (
    <section
      className="home-workspace mx-auto grid w-full max-w-6xl gap-3 lg:content-start"
      aria-label="خانه استاد"
    >
      <section className="workspace-actions flex items-baseline justify-between gap-3 px-1 pt-1">
        <h2 className="sr-only">امروز در مدرسه</h2>
        <span className="text-xs text-slate-500">
          امروز · {formatDate(todayIso(), { dateStyle: "full" })}
        </span>
      </section>
      <AnnouncementEnvelope announcements={home.data?.home?.announcements} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card
          className={`col-span-2 min-w-0 p-3 sm:col-span-1 ${currentClass ? "border-2 border-brand bg-brand/5 shadow-lg shadow-brand/10" : ""}`}
          aria-label="کلاس جاری"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
                <CalendarClock size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-black text-ink">کلاس همین حالا</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">بر اساس ساعت جاری تهران</p>
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
              className="mt-3 flex w-full items-center gap-2 rounded-xl bg-brand p-3 text-right text-white outline-none transition hover:bg-brand/90 focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none"
              aria-label={`باز کردن فهرست ${currentClass.title}`}
            >
              <Clock3 size={17} className="shrink-0 text-white" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{currentClass.title}</p>
                <p className="mt-0.5 text-xs text-white/80">
                  {currentClass.startTime} تا {currentClass.endTime}
                  {currentClass.room ? ` · ${currentClass.room}` : ""}
                </p>
              </div>
            </button>
          ) : (
            <EmptyState title="در این ساعت کلاسی ندارید." />
          )}
        </Card>

        <CurrentPrayerCard times={prayerTimes} />
      </div>

      <section aria-labelledby="teacher-classes-title" className="grid gap-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <h2 id="teacher-classes-title" className="text-sm font-black text-ink">
              کلاس‌های امروز من
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              فقط کلاس‌های واگذارشده‌ای که امروز در برنامه شما هستند.
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
        ) : classes.data?.filter((classroom) =>
            todayEntries.some((entry) => entry.classroom?.id === classroom.id),
          ).length ? (
          <div className="grid gap-3 sm:grid-cols-2 min-[1200px]:grid-cols-3">
            {classes.data
              .filter((classroom) =>
                todayEntries.some((entry) => entry.classroom?.id === classroom.id),
              )
              .map((classroom) => (
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
                        <BookOpenCheck
                          size={14}
                          className="shrink-0 text-brand"
                          aria-hidden="true"
                        />
                        <span className="truncate font-bold">{book.title}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
          </div>
        ) : (
          <EmptyState title="امروز کلاس واگذارشده‌ای ندارید." />
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
