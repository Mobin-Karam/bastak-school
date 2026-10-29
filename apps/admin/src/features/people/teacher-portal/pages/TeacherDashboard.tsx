import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, Clock3, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../identity/auth";
import {
  listLegacyAcademicCycles,
  listScheduleByAcademicPeriod,
  type ScheduleEntry,
} from "../../../academics/schedule/api/schedule.api";
import { todayIso } from "../../../../shared/lib/utils";
import { useLocale } from "../../../../shared/ui/locale";
import { Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { getAdminDashboard } from "../../../analytics/dashboard/api/dashboard.api";
import { CurrentPrayerCard } from "../../../analytics/school-home/components/CurrentPrayerCard";
import { TeacherClassAttendanceSheet } from "../components/TeacherClassAttendanceSheet";
import {
  activeEntriesForTehranToday,
  nextTeacherScheduleEntry,
  tehranDateWithOffset,
} from "../model/teacher-dashboard-schedule";
import { listTeacherLeaveRequests } from "../../../academics/schedule/api/teacher-leave.api";

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
  const [selectedClassDate, setSelectedClassDate] = useState<string>();
  const organizationId = auth.context?.activeOrganization?.id;
  const academicCycles = useQuery({
    queryKey: ["schedule", "teacher-academic-cycles", organizationId],
    queryFn: () => listLegacyAcademicCycles(organizationId!),
    enabled: Boolean(organizationId),
  });
  const activeAcademicYear = academicCycles.data?.years.find((year) => year.state === "ACTIVE");
  const activeAcademicTerm = academicCycles.data?.terms.find(
    (term) => term.academicYearId === activeAcademicYear?.id && term.state === "ACTIVE",
  );
  const home = useQuery({
    queryKey: ["dashboard", "teacher-home"],
    queryFn: () => getAdminDashboard("TEACHER"),
  });
  const schedule = useQuery({
    queryKey: [
      "schedule",
      "teacher",
      organizationId,
      activeAcademicYear?.id,
      activeAcademicTerm?.id,
    ],
    queryFn: () =>
      activeAcademicYear && activeAcademicTerm
        ? listScheduleByAcademicPeriod({
            academicYearId: activeAcademicYear.id,
            termId: activeAcademicTerm.id,
          })
        : Promise.resolve([]),
    enabled: academicCycles.isSuccess,
  });
  const leaves = useQuery({
    queryKey: ["teacher-leaves", "self"],
    queryFn: listTeacherLeaveRequests,
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
  const scheduledTodayEntries = useMemo(
    () => activeEntriesForTehranToday(schedule.data ?? [], now),
    [schedule.data, now],
  );
  const currentMinute = tehranClockMinutes(now);
  const today = todayIso();
  const activeLeave = (leaves.data ?? []).find(
    (leave) =>
      leave.status === "approved" &&
      leave.startDate <= today &&
      leave.endDate >= today &&
      !(leave.returnStatus === "approved" && leave.returnDate && leave.returnDate <= today),
  );
  // A leave freezes attendance entry points as well as the visible schedule.
  const todayEntries = activeLeave ? [] : scheduledTodayEntries;
  const currentClass =
    todayEntries.find(
      (entry) =>
        currentMinute >= clockMinutes(entry.startTime) &&
        currentMinute < clockMinutes(entry.endTime),
    ) ?? null;
  const nextClass = activeLeave ? null : nextTeacherScheduleEntry(schedule.data ?? [], now);
  const attendanceEntry = currentClass ?? nextClass?.entry ?? null;
  const nextClassDayLabel = !nextClass
    ? "برنامهٔ آینده"
    : nextClass.dayOffset === 0
      ? "امروز"
      : nextClass.dayOffset === 1
        ? "فردا"
        : `${nextClass.dayOffset.toLocaleString("fa-IR")} روز دیگر`;

  if ((schedule.isLoading || academicCycles.isLoading) && home.isLoading)
    return <LoadingState label="در حال آماده‌سازی میز استاد…" />;

  return (
    <section
      className="home-workspace mx-auto grid w-full max-w-6xl gap-3 lg:content-start"
      aria-label="خانه استاد"
    >
      <header className="rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-4 py-4 sm:px-5">
        <p className="text-xs font-bold text-brand">داشبورد امروز استاد</p>
        <h1 className="mt-1 text-lg font-black text-ink sm:text-xl">
          {formatDate(todayIso(), { dateStyle: "full" })}
        </h1>
      </header>
      {activeLeave ? (
        <Card className="border-amber-300 bg-amber-50 p-3 text-sm font-bold text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          شما در بازه مرخصی تأییدشده هستید: {formatDate(activeLeave.startDate)} تا{" "}
          {formatDate(activeLeave.endDate)}
        </Card>
      ) : null}
      {!academicCycles.isLoading && (!activeAcademicYear || !activeAcademicTerm) ? (
        <Card className="border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          برای نمایش و ثبت جلسه‌های برنامه، مدیر باید یک سال تحصیلی و نیم‌سال فعال انتخاب کند.
        </Card>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
        <Card className="min-w-0 overflow-hidden p-0" aria-label="کلاس بعدی استاد">
          <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                <CalendarClock size={21} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-brand">
                  {currentClass ? "کلاس در حال برگزاری" : `کلاس بعدی · ${nextClassDayLabel}`}
                </p>
                <h2 className="mt-1 text-base font-black text-ink sm:text-lg">
                  {attendanceEntry?.title ?? "کلاس آینده‌ای ثبت نشده است"}
                </h2>
                {attendanceEntry ? (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {attendanceEntry.classroom?.name ?? "کلاس ثبت نشده"} ·{" "}
                    {attendanceEntry.classBook?.book.titleFa ?? "درس ثبت نشده"}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          {attendanceEntry ? (
            <button
              type="button"
              onClick={() => {
                setSelectedClassDate(
                  currentClass ? today : tehranDateWithOffset(now, nextClass?.dayOffset ?? 0),
                );
                setSelectedClass(attendanceEntry);
              }}
              className="flex w-full items-center justify-between gap-3 border-t border-brand/15 bg-brand/5 px-4 py-3 text-right outline-none transition-colors hover:bg-brand/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand sm:px-5"
              aria-label={`باز کردن جلسه ${attendanceEntry.title}`}
            >
              <span className="flex min-w-0 items-center gap-2 text-sm font-black text-brand">
                <Clock3 size={17} className="shrink-0" aria-hidden="true" />
                {attendanceEntry.startTime} تا {attendanceEntry.endTime}
                {attendanceEntry.room ? ` · ${attendanceEntry.room}` : ""}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand">
                ورود به جلسه <ArrowLeft size={15} aria-hidden="true" />
              </span>
            </button>
          ) : (
            <div className="border-t border-[rgb(var(--border-subtle))] px-4 py-3 sm:px-5">
              <EmptyState title="در برنامهٔ شما کلاس آینده‌ای وجود ندارد." />
            </div>
          )}
        </Card>

        <CurrentPrayerCard times={prayerTimes} className="min-h-32 h-full" />
      </div>

      <section
        aria-labelledby="teacher-classes-title"
        className="min-w-0 rounded-3xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-brand">برنامهٔ امروز</p>
            <h2 id="teacher-classes-title" className="mt-1 text-base font-black text-ink">
              خط زمانی کلاس‌های من
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              برای حضور و غیاب، فهرست دانش‌آموزان، سکه و گزارش خصوصی هر جلسه را باز کنید.
            </p>
          </div>
          <Link
            className="shrink-0 text-xs font-bold text-brand hover:underline"
            to="/admin/schedule"
          >
            برنامهٔ هفتگی
          </Link>
        </div>
        {schedule.isLoading ? (
          <div className="mt-4">
            <LoadingState label="در حال دریافت کلاس‌های امروز شما…" />
          </div>
        ) : schedule.isError ? (
          <div className="mt-4">
            <EmptyState title="برنامهٔ امروز شما دریافت نشد." />
          </div>
        ) : todayEntries.length ? (
          <ol
            className="mt-5 space-y-3 border-s-2 border-brand/20 ps-4 sm:ps-5"
            aria-label="خط زمانی کلاس‌های امروز"
          >
            {todayEntries.map((entry) => (
              <li key={entry.id} className="relative">
                <span
                  className="absolute -start-[1.58rem] top-5 grid size-5 place-items-center rounded-full border-4 border-[rgb(var(--surface-card))] bg-brand sm:-start-[1.82rem]"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setSelectedClass(entry)}
                  className="grid w-full gap-3 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-4 text-right transition-colors hover:border-brand/50 hover:bg-brand/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
                  aria-label={`باز کردن جلسه ${entry.title}`}
                >
                  <time className="font-black tabular-nums text-brand" dir="ltr">
                    {entry.startTime} — {entry.endTime}
                  </time>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-black text-ink sm:text-xl">
                      {entry.classroom?.name ?? entry.title}
                    </h3>
                    <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">
                      {entry.title} · {entry.classBook?.book.titleFa ?? "درس ثبت نشده"}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-brand">
                    <MapPin size={15} aria-hidden="true" /> {entry.room || "بدون اتاق"}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-4">
            <EmptyState title="امروز کلاس واگذارشده‌ای ندارید." />
          </div>
        )}
      </section>

      <TeacherClassAttendanceSheet
        entry={selectedClass}
        open={Boolean(selectedClass)}
        onOpenChange={(open) => !open && setSelectedClass(null)}
        canManage={auth.can("attendance.manage")}
        semesterStartsOn={activeAcademicTerm?.startsOn}
        semesterEndsOn={activeAcademicTerm?.endsOn}
        initialDate={selectedClassDate}
      />
    </section>
  );
}
