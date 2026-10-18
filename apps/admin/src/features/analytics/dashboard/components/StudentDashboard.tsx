import { TimetableToday } from "../../schedule";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck2, CalendarClock, ChevronLeft, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAttendanceEncouragement, type SelfAttendanceRecord } from "../../attendance/public";
import { listSchedule } from "../../schedule/api/schedule.api";
import { useAuth } from "../../auth";
import { fa, todayIso } from "../../../shared/lib/utils";
import { useLocale } from "../../../shared/ui/locale";
import { Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { getAdminDashboard } from "../api/dashboard.api";
import { DashboardCalendar } from "./DashboardCalendar";
import { AnnouncementEnvelope } from "./AnnouncementEnvelope";
import { CurrentPrayerCard } from "../../school-home/components/CurrentPrayerCard";

const attendanceMeta: Record<
  SelfAttendanceRecord["status"],
  { label: string; tone: "green" | "red" | "amber" | "blue" }
> = {
  present: { label: "حاضر", tone: "green" },
  absent: { label: "غایب", tone: "red" },
  late: { label: "با تأخیر", tone: "amber" },
  excused: { label: "موجه", tone: "blue" },
};

/** A personal, read-only home for students. All records remain scoped by the API. */
export function StudentDashboard() {
  const auth = useAuth();
  const { formatDate } = useLocale();
  const [calendarDate, setCalendarDate] = useState(todayIso);
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
  const weekday = new Date(`${calendarDate}T12:00:00`).getDay();
  const selectedClasses = useMemo(
    () =>
      (schedule.data ?? []).filter(
        (entry) => entry.status === "ACTIVE" && entry.weekday === weekday,
      ),
    [schedule.data, weekday],
  );
  const attendanceCounts = attendanceSummary.data ?? { present: 0, absent: 0, late: 0, excused: 0 };
  const prayer = home.data?.home?.prayer;
  const prayerTimes = prayer && "times" in prayer ? prayer.times : null;
  const currentClass = home.data?.home?.currentClass ?? selectedClasses[0] ?? null;

  if (schedule.isLoading && attendanceSummary.isLoading) {
    return <LoadingState label="در حال آماده‌سازی خانه دانش‌آموز…" />;
  }

  return (
    <section
      className="home-workspace mx-auto grid w-full max-w-6xl gap-3 lg:content-start"
      aria-label="خانه دانش‌آموز"
    >
      <section className="workspace-actions flex items-baseline justify-between gap-3 px-1 pt-1">
        <h2 className="sr-only">امروز در مدرسه</h2>
        <span className="text-xs text-slate-500">
          {formatDate(calendarDate, { dateStyle: "medium" })}
        </span>
      </section>
      <TimetableToday />

      <DashboardCalendar
        value={calendarDate}
        onChange={setCalendarDate}
        capabilities={auth.capabilities}
        schedule={schedule.data ?? []}
      />

      <AnnouncementEnvelope announcements={home.data?.home?.announcements} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="min-w-0 p-3" aria-label="کلاس جاری">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
                <CalendarClock size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-black text-ink">کلاس جاری</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">بر اساس برنامه امروز</p>
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
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-[rgb(var(--surface-muted))] p-3">
              <Clock3 size={17} className="shrink-0 text-brand" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{currentClass.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {currentClass.startTime} تا {currentClass.endTime}
                  {currentClass.room ? ` · ${currentClass.room}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState title="اکنون کلاسی ندارید." />
          )}
        </Card>

        <CurrentPrayerCard times={prayerTimes} />
        <Card className="min-w-0 p-3" aria-label="زمان کلاس‌های امروز">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
              <Clock3 size={18} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-black text-ink">زمان کلاس‌های امروز</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">ثبت‌شده توسط مدیریت مدرسه</p>
            </div>
          </div>
          {selectedClasses.length ? (
            <ul className="mt-3 grid gap-2">
              {selectedClasses.slice(0, 3).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[rgb(var(--surface-muted))] px-3 py-2"
                >
                  <span className="min-w-0 truncate text-xs font-bold text-ink">{entry.title}</span>
                  <time
                    dateTime={entry.startTime}
                    dir="ltr"
                    className="shrink-0 text-xs font-black text-brand"
                  >
                    {fa(entry.startTime)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-slate-500">امروز کلاسی در برنامه شما نیست.</p>
          )}
        </Card>
        <Card className="p-3" aria-label="خلاصه حضور و غیاب">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <CalendarCheck2 size={18} className="text-brand" aria-hidden="true" />
              <h2 className="text-sm font-black text-ink">حضور و غیاب من</h2>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Object.entries(attendanceMeta).map(([status, meta]) => (
              <div
                key={status}
                className="rounded-lg bg-[rgb(var(--surface-muted))] px-2 py-2 text-center"
              >
                <p className="text-lg font-black text-ink">
                  {attendanceCounts[status as SelfAttendanceRecord["status"]].toLocaleString(
                    "fa-IR",
                  )}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">{meta.label}</p>
              </div>
            ))}
          </div>
          {attendanceSummary.data?.message ? (
            <p className="mt-3 text-xs leading-6 text-slate-500">
              {attendanceSummary.data.message}
            </p>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
