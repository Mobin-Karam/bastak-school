import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarCheck2, ChevronLeft, Clock3, Trophy } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getAttendanceEncouragement,
  type SelfAttendanceRecord,
} from "../../../student-life/attendance/public";
import { listSchedule } from "../../../academics/schedule/api/schedule.api";
import { useAuth } from "../../../identity/auth";
import { fa, todayIso } from "../../../../shared/lib/utils";
import { useLocale } from "../../../../shared/ui/locale";
import { Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { CurrentPrayerCard } from "../../school-home/components/CurrentPrayerCard";
import { getAdminDashboard } from "../api/dashboard.api";
import { AnnouncementEnvelope } from "./AnnouncementEnvelope";

const attendanceMeta: Record<SelfAttendanceRecord["status"], { label: string; tone: string }> = {
  present: { label: "حاضر", tone: "text-emerald-700 dark:text-emerald-300" },
  absent: { label: "غایب", tone: "text-rose-700 dark:text-rose-300" },
  late: { label: "تأخیر", tone: "text-amber-700 dark:text-amber-300" },
  excused: { label: "موجه", tone: "text-sky-700 dark:text-sky-300" },
};

/** A bounded, single-screen home for students. API scoping remains authoritative. */
export function StudentDashboard() {
  const auth = useAuth();
  const { formatDate } = useLocale();
  const home = useQuery({
    queryKey: ["dashboard", "student-home"],
    queryFn: () => getAdminDashboard("STUDENT"),
  });
  const schedule = useQuery({ queryKey: ["schedule", "student"], queryFn: listSchedule });
  const attendanceSummary = useQuery({
    queryKey: [
      "attendance-encouragement",
      auth.user?.id,
      auth.activeRole,
      auth.context?.activeOrganization?.id,
    ],
    queryFn: getAttendanceEncouragement,
    enabled: auth.can("attendance.self.read"),
  });

  const currentDate = todayIso();
  const weekday = new Date(`${currentDate}T12:00:00`).getDay();
  const selectedClasses = useMemo(
    () =>
      (schedule.data ?? []).filter(
        (entry) => entry.status === "ACTIVE" && entry.weekday === weekday,
      ),
    [schedule.data, weekday],
  );
  const attendanceCounts = attendanceSummary.data ?? { present: 0, absent: 0, late: 0, excused: 0 };
  const attendancePoints = (attendanceSummary.data as { points?: number } | undefined)?.points ?? 0;
  const prayer = home.data?.home?.prayer;
  const prayerTimes = prayer && "times" in prayer ? prayer.times : null;
  const currentClass = home.data?.home?.currentClass ?? selectedClasses[0] ?? null;
  const firstName = auth.user?.firstName || auth.user?.displayName || "دانش‌آموز";

  if (schedule.isLoading && attendanceSummary.isLoading) {
    return <LoadingState label="در حال آماده‌سازی خانه دانش‌آموز…" />;
  }

  return (
    <section
      dir="rtl"
      className="home-workspace mx-auto grid h-[calc(var(--admin-viewport-height,100dvh)-10rem)] w-full max-w-6xl grid-rows-[auto_auto_minmax(0,1fr)] gap-2 overflow-hidden sm:h-[calc(var(--admin-viewport-height,100dvh)-9rem)] sm:gap-3 lg:h-[calc(var(--admin-viewport-height,100dvh)-8rem)]"
      aria-label="خانه دانش‌آموز"
    >
      <header className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-[rgb(var(--surface-card))] px-3 py-2.5 shadow-sm dark:border-slate-800 sm:px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-ink">سلام، {firstName}</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">
            {formatDate(currentDate, { dateStyle: "full" })}
          </p>
        </div>
        <Link
          to="/admin/books"
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl bg-brand/10 px-3 text-xs font-bold text-brand transition-colors hover:bg-brand/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <BookOpen size={15} aria-hidden="true" />
          کتاب‌ها
        </Link>
      </header>

      <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(8.5rem,.7fr)] gap-2 sm:gap-3">
        <Card className="min-w-0 overflow-hidden p-3" aria-label="کلاس جاری">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <Clock3 size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-xs font-black text-ink">کلاس امروز</h2>
                <p className="truncate text-[10px] text-slate-500">بر اساس برنامه مدرسه</p>
              </div>
            </div>
            <Link
              className="shrink-0 text-[11px] font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              to="/admin/schedule"
            >
              برنامه
            </Link>
          </div>
          {currentClass ? (
            <div className="mt-2 flex min-w-0 items-center gap-2 rounded-xl bg-[rgb(var(--surface-muted))] px-2.5 py-2">
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-ink">
                {currentClass.title}
              </span>
              <time
                dateTime={currentClass.startTime}
                dir="ltr"
                className="shrink-0 text-xs font-black text-brand"
              >
                {fa(currentClass.startTime)}
              </time>
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">امروز کلاسی ندارید.</p>
          )}
        </Card>
        <CurrentPrayerCard times={prayerTimes} className="min-w-0 px-2.5 py-2 sm:px-3" />
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(15rem,.8fr)] sm:gap-3">
        <Card className="min-h-0 overflow-hidden p-3" aria-label="زمان کلاس‌های امروز">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-brand/10 text-brand">
                <Clock3 size={16} aria-hidden="true" />
              </span>
              <h2 className="text-xs font-black text-ink">برنامه امروز</h2>
            </div>
            <Link
              className="inline-flex items-center gap-0.5 text-[11px] font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              to="/admin/schedule"
            >
              همه <ChevronLeft size={14} aria-hidden="true" />
            </Link>
          </div>
          {selectedClasses.length ? (
            <ul className="mt-2 grid gap-1.5">
              {selectedClasses.slice(0, 3).map((entry) => (
                <li
                  key={entry.id}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-[rgb(var(--surface-muted))] px-2.5 py-1.5"
                >
                  <span className="min-w-0 truncate text-xs font-bold text-ink">{entry.title}</span>
                  <time
                    dateTime={entry.startTime}
                    dir="ltr"
                    className="shrink-0 text-[11px] font-black text-brand"
                  >
                    {fa(entry.startTime)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="امروز کلاسی در برنامه شما نیست." />
          )}
        </Card>

        <Card className="min-h-0 overflow-hidden p-3" aria-label="خلاصه حضور و غیاب">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarCheck2 size={17} className="text-brand" aria-hidden="true" />
              <h2 className="text-xs font-black text-ink">حضور من</h2>
            </div>
            <Link
              to="/admin/my-attendance"
              className="text-[11px] font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              جزئیات
            </Link>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {Object.entries(attendanceMeta).map(([status, meta]) => (
              <div
                key={status}
                className="rounded-lg bg-[rgb(var(--surface-muted))] px-1 py-1.5 text-center"
              >
                <p className={`text-base font-black ${meta.tone}`}>
                  {attendanceCounts[status as SelfAttendanceRecord["status"]].toLocaleString(
                    "fa-IR",
                  )}
                </p>
                <p className="mt-0.5 text-[9px] text-slate-500">{meta.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <span className="flex items-center gap-1 text-[11px] font-bold">
              <Trophy size={14} aria-hidden="true" /> امتیاز
            </span>
            <strong className="text-sm">{attendancePoints.toLocaleString("fa-IR")}</strong>
          </div>
          {attendanceSummary.data?.message ? (
            <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-500">
              {attendanceSummary.data.message}
            </p>
          ) : null}
        </Card>
      </div>

      <AnnouncementEnvelope announcements={home.data?.home?.announcements} />
    </section>
  );
}
