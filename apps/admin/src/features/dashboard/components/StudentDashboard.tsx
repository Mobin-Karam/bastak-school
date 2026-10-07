import { useQuery } from "@tanstack/react-query";
import {
  BellRing,
  CalendarCheck2,
  CalendarClock,
  ChevronLeft,
  Clock3,
  MapPin,
  Settings2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listSelfAttendance, type SelfAttendanceRecord } from "../../attendance/api/attendance.api";
import { listSchedule } from "../../schedule/api/schedule.api";
import { useAuth } from "../../auth";
import { todayIso } from "../../../shared/lib/utils";
import { useLocale } from "../../../shared/ui/locale";
import { Badge, Card, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { getAdminDashboard } from "../api/dashboard.api";
import { DashboardCalendar } from "./DashboardCalendar";

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
  const attendance = useQuery({
    queryKey: ["attendance", "self"],
    queryFn: listSelfAttendance,
  });
  const weekday = new Date(`${calendarDate}T12:00:00`).getDay();
  const selectedClasses = useMemo(
    () =>
      (schedule.data ?? []).filter(
        (entry) => entry.status === "ACTIVE" && entry.weekday === weekday,
      ),
    [schedule.data, weekday],
  );
  const attendanceCounts = useMemo(
    () =>
      (attendance.data ?? []).reduce<Record<SelfAttendanceRecord["status"], number>>(
        (total, record) => ({ ...total, [record.status]: total[record.status] + 1 }),
        { present: 0, absent: 0, late: 0, excused: 0 },
      ),
    [attendance.data],
  );
  const prayer = home.data?.home?.prayer;
  const prayerTimes = prayer && "times" in prayer ? prayer.times : null;

  if (schedule.isLoading && attendance.isLoading) {
    return <LoadingState label="در حال آماده‌سازی خانه دانش‌آموز…" />;
  }

  return (
    <section
      className="mx-auto grid w-full max-w-6xl gap-3 pb-6 sm:gap-4"
      aria-label="خانه دانش‌آموز"
    >
      <header className="px-1 pt-1 sm:pt-2">
        <p className="text-xs font-bold text-brand">فضای آموزشی من</p>
        <h1 className="mt-1 text-xl font-black tracking-tight text-ink sm:text-2xl">
          امروز در مدرسه
        </h1>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          کلاس‌ها، حضور و غیاب و اطلاعیه‌های مرتبط با حساب شما.
        </p>
      </header>

      <DashboardCalendar
        value={calendarDate}
        onChange={setCalendarDate}
        capabilities={auth.capabilities}
        schedule={schedule.data ?? []}
      />

      <div className="grid gap-3 lg:grid-cols-[1.15fr_.85fr]">
        <Card className="min-w-0 p-3 sm:p-4" aria-label="برنامه کلاس‌ها">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
                <CalendarClock size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-black text-ink">
                  کلاس‌های {formatDate(calendarDate, { dateStyle: "medium" })}
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">برنامه کلاس‌های در دسترس شما</p>
              </div>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-xs font-bold text-brand"
              to="/admin/schedule"
            >
              برنامه کامل <ChevronLeft size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-3 grid gap-2">
            {selectedClasses.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-3"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-brand shadow-sm dark:bg-slate-900">
                  <Clock3 size={17} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{entry.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {entry.startTime} تا {entry.endTime}
                    {entry.room ? ` · ${entry.room}` : ""}
                  </p>
                </div>
                {entry.classroom?.name ? <Badge tone="blue">{entry.classroom.name}</Badge> : null}
              </div>
            ))}
            {!selectedClasses.length ? (
              <EmptyState title="کلاسی برای این روز ثبت نشده است." />
            ) : null}
          </div>
        </Card>

        <div className="grid gap-3">
          <Card className="p-3 sm:p-4" aria-label="اوقات شرعی">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <MapPin size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-black text-ink">اوقات شرعی</h2>
                {prayerTimes ? (
                  <div className="mt-2 grid grid-cols-3 gap-1 text-center text-xs">
                    <Time label="صبح" value={prayerTimes.fajr} />
                    <Time label="ظهر" value={prayerTimes.dhuhr} />
                    <Time label="مغرب" value={prayerTimes.maghrib} />
                  </div>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    اوقات شرعی مدرسه هنوز ثبت نشده است.
                  </p>
                )}
              </div>
            </div>
          </Card>
          <Link
            to="/admin/settings"
            className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <Card className="flex items-center gap-3 p-3 transition hover:border-brand/30">
              <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Settings2 size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-black text-ink">تنظیمات حساب</span>
                <span className="mt-0.5 block text-xs text-slate-500">شماره همراه و گذرواژه</span>
              </span>
              <ChevronLeft size={18} className="text-slate-400" aria-hidden="true" />
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-3 sm:p-4" aria-label="خلاصه حضور و غیاب">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarCheck2 size={18} className="text-brand" aria-hidden="true" />
              <h2 className="text-sm font-black text-ink">حضور و غیاب من</h2>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-xs font-bold text-brand"
              to="/admin/my-attendance"
            >
              مشاهده همه <ChevronLeft size={15} aria-hidden="true" />
            </Link>
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
          {attendance.data?.slice(0, 2).map((record) => (
            <div key={record.id} className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">
                {formatDate(record.sessionDate, { dateStyle: "medium" })}
              </span>
              <Badge tone={attendanceMeta[record.status].tone}>
                {attendanceMeta[record.status].label}
              </Badge>
            </div>
          ))}
        </Card>

        {home.data?.home?.announcements?.length ? (
          <Card className="p-3 sm:p-4" aria-label="پیام‌های مدرسه">
            <div className="flex items-center gap-2 text-brand">
              <BellRing size={18} aria-hidden="true" />
              <h2 className="text-sm font-black text-ink">پیام‌های مدرسه</h2>
            </div>
            <div className="mt-3 grid gap-2">
              {home.data.home.announcements.slice(0, 2).map((announcement) => (
                <article key={announcement.id} className="rounded-xl bg-brand/[0.05] p-3">
                  <h3 className="text-xs font-bold text-ink">{announcement.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                    {announcement.body}
                  </p>
                </article>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

function Time({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-amber-50 px-1 py-1.5 dark:bg-amber-950/25">
      <p className="text-[10px] text-amber-800 dark:text-amber-200">{label}</p>
      <p className="mt-0.5 font-bold text-amber-950 dark:text-amber-100">{value}</p>
    </div>
  );
}
