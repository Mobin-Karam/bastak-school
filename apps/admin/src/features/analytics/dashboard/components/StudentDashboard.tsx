import { useQuery } from "@tanstack/react-query";
import { BellRing, BookOpen, CalendarCheck2, Clock3, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAttendanceEncouragement,
  type SelfAttendanceRecord,
} from "../../../student-life/attendance/public";
import { useAuth } from "../../../identity/auth";
import { fa, todayIso } from "../../../../shared/lib/utils";
import { useLocale } from "../../../../shared/ui/locale";
import { Card, LoadingState } from "../../../../shared/ui/ui";
import { AttendanceCoin } from "../../../../shared/ui/attendance-coin";
import { CurrentPrayerCard } from "../../school-home/components/CurrentPrayerCard";
import { getAdminDashboard } from "../api/dashboard.api";
import { AnnouncementEnvelope } from "./AnnouncementEnvelope";
import { StudentAttendanceProfileDrawer } from "../../../student-life/attendance/components/StudentAttendanceProfileDrawer";
import { getSelfAttendanceHistory } from "../../../student-life/attendance/api/attendance.api";
import { notifications } from "../../../../shared/ui/notifications";
import {
  findNextStudentClass,
  studentAttendanceWeek,
  type NextStudentClass,
} from "./student-dashboard-model";

const attendanceMeta: Record<
  SelfAttendanceRecord["status"],
  { label: string; tone: string; surface: string }
> = {
  present: {
    label: "حاضر",
    tone: "text-emerald-950 dark:text-emerald-50",
    surface: "bg-emerald-200/90 dark:bg-emerald-700/70",
  },
  absent: {
    label: "غایب",
    tone: "text-rose-950 dark:text-rose-50",
    surface: "bg-rose-200/90 dark:bg-rose-700/70",
  },
  late: {
    label: "تأخیر",
    tone: "text-amber-950 dark:text-amber-50",
    surface: "bg-amber-200/90 dark:bg-amber-700/70",
  },
  excused: {
    label: "موجه",
    tone: "text-sky-950 dark:text-sky-50",
    surface: "bg-sky-200/90 dark:bg-sky-700/70",
  },
};

/** A bounded, single-screen home for students. API scoping remains authoritative. */
export function StudentDashboard() {
  const auth = useAuth();
  const { formatDate } = useLocale();
  const home = useQuery({
    queryKey: ["dashboard", "student-home"],
    queryFn: () => getAdminDashboard("STUDENT"),
    refetchInterval: 30_000,
  });
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
  const attendanceWeek = studentAttendanceWeek(currentDate);
  const weeklyAbsences = useQuery({
    queryKey: [
      "student-attendance-history",
      "weekly-absences",
      auth.user?.id,
      auth.context?.activeOrganization?.id,
      attendanceWeek.from,
      attendanceWeek.to,
    ],
    queryFn: () =>
      getSelfAttendanceHistory({
        page: 1,
        limit: 100,
        status: "absent",
        from: attendanceWeek.from,
        to: attendanceWeek.to,
      }),
    enabled: auth.can("attendance.self.read"),
  });
  const attendanceCounts = attendanceSummary.data ?? { present: 0, absent: 0, late: 0, excused: 0 };
  const attendancePoints = (attendanceSummary.data as { points?: number } | undefined)?.points ?? 0;
  const prayer = home.data?.home?.prayer;
  const prayerTimes = prayer && "times" in prayer ? prayer.times : null;
  // The dashboard is a live "now" view. The complete timetable remains on
  // its dedicated route, so never substitute the first scheduled class here.
  const currentClass = home.data?.home?.currentClass ?? null;
  const nextClass = useMemo(
    () => findNextStudentClass(home.data?.home?.calendar.entries),
    [home.data?.home?.calendar.entries],
  );
  const firstName = auth.user?.firstName || auth.user?.displayName || "دانش‌آموز";
  const [attendanceProfileOpen, setAttendanceProfileOpen] = useState(false);
  const attendanceScope = JSON.stringify([
    auth.user?.id,
    auth.activeRole,
    auth.context?.activeOrganization?.id,
  ]);
  const classAlert = useStudentClassStartAlert(nextClass);

  if (home.isLoading && attendanceSummary.isLoading) {
    return <LoadingState label="در حال آماده‌سازی خانه دانش‌آموز…" />;
  }

  return (
    <section
      dir="rtl"
      className="student-dashboard mx-auto w-full max-w-6xl pb-24 sm:pb-6"
      aria-label="خانه دانش‌آموز"
    >
      <header className="student-dashboard__hero relative overflow-hidden rounded-[1.75rem] px-4 py-5 text-white sm:px-6 sm:py-6">
        <div
          className="student-dashboard__hero-orb student-dashboard__hero-orb--one"
          aria-hidden="true"
        />
        <div
          className="student-dashboard__hero-orb student-dashboard__hero-orb--two"
          aria-hidden="true"
        />
        <div className="relative flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-bold text-sky-100">
              <Sparkles size={15} aria-hidden="true" /> خانه من
            </p>
            <h1 className="mt-2 truncate text-xl font-black sm:text-2xl">سلام، {firstName}</h1>
            <p className="mt-1 truncate text-xs text-sky-100/85 sm:text-sm">
              {formatDate(currentDate, { dateStyle: "full" })}
            </p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-black text-white">
              {weeklyAbsences.isLoading
                ? "در حال بررسی غیبت‌های هفته…"
                : `${(weeklyAbsences.data?.total ?? 0).toLocaleString("fa-IR")} غیبت در این هفته`}
            </p>
          </div>
          <Link
            to="/admin/books"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <BookOpen size={18} aria-hidden="true" />
            <span className="hidden sm:inline">کتاب‌ها</span>
          </Link>
        </div>
      </header>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {currentClass ? (
          <Card
            className="student-dashboard__surface min-w-0 overflow-hidden border-emerald-300/80 bg-emerald-50/75 p-4 dark:border-emerald-500/35 dark:bg-emerald-950/25"
            aria-label="کلاس در حال برگزاری"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white">
                  <Clock3 size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-black text-emerald-950 dark:text-emerald-100">
                    کلاس در حال برگزاری
                  </h2>
                  <p className="truncate text-[11px] text-emerald-800/80 dark:text-emerald-200/80">
                    اکنون می‌توانید به کلاس بروید
                  </p>
                </div>
              </div>
              <Link
                className="shrink-0 text-[11px] font-bold text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:text-emerald-200"
                to="/admin/schedule"
              >
                برنامه
              </Link>
            </div>
            <div className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 dark:bg-slate-950/30">
              <span className="min-w-0 flex-1 truncate text-sm font-black text-emerald-950 dark:text-emerald-100">
                {currentClass.title}
              </span>
              <time
                dateTime={currentClass.startTime}
                dir="ltr"
                className="shrink-0 text-sm font-black text-emerald-700 dark:text-emerald-300"
              >
                {fa(currentClass.startTime)}
              </time>
            </div>
          </Card>
        ) : null}
        <Card
          className="student-dashboard__surface min-w-0 overflow-hidden border-amber-300/80 bg-amber-50/80 p-4 dark:border-amber-500/35 dark:bg-amber-950/25"
          aria-label="کلاس بعدی"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-500 text-amber-950">
                <Clock3 size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-amber-950 dark:text-amber-100">
                  کلاس بعدی من
                </h2>
                <p className="truncate text-[11px] text-amber-800/80 dark:text-amber-200/80">
                  بر اساس برنامهٔ شخصی و ساعت تهران
                </p>
              </div>
            </div>
            <Link
              className="shrink-0 text-[11px] font-bold text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 dark:text-amber-200"
              to="/admin/schedule"
            >
              برنامه
            </Link>
          </div>
          {nextClass ? (
            <div className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 dark:bg-slate-950/30">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-[10px] font-black text-amber-950">
                بعدی
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-black text-amber-950 dark:text-amber-100">
                {nextClass.title}
              </span>
              <time
                dateTime={nextClass.startsAt}
                dir="ltr"
                className="shrink-0 text-sm font-black text-amber-800 dark:text-amber-200"
              >
                {fa(nextClass.startTime)}
              </time>
            </div>
          ) : (
            <p className="mt-4 text-xs text-amber-800/80 dark:text-amber-200/80">
              کلاس بعدی در برنامهٔ شما ثبت نشده است.
            </p>
          )}
          {nextClass ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-100">
              <span>
                {nextClass.className || "کلاس"}
                {nextClass.room ? ` · ${nextClass.room}` : ""}
              </span>
              {classAlert.canEnable ? (
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-1 rounded-xl px-2 font-black text-amber-900 outline-none hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-600 dark:text-amber-100 dark:hover:bg-amber-900/30"
                  onClick={() => void classAlert.enable()}
                >
                  <BellRing size={15} aria-hidden="true" /> یادآور کلاس را فعال کن
                </button>
              ) : null}
            </div>
          ) : null}
        </Card>
      </div>

      <CurrentPrayerCard
        times={prayerTimes}
        className="student-dashboard__prayer mt-3 min-w-0 px-3 py-3"
      />

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setAttendanceProfileOpen(true)}
          className="student-dashboard__surface min-h-0 overflow-hidden p-4"
          aria-label="خلاصه حضور و غیاب"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarCheck2 size={17} className="text-brand" aria-hidden="true" />
              <h2 className="text-xs font-black text-ink">حضور من</h2>
            </div>
            <span className="text-[11px] font-bold text-brand">دیدن تاریخچه</span>
          </div>
          <div className="student-dashboard__hex-grid mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(attendanceMeta).map(([status, meta]) => (
              <div
                key={status}
                className={`mx-auto grid aspect-[1.16/1] w-full max-w-28 place-items-center px-3 text-center shadow-sm transition-transform duration-200 hover:-translate-y-0.5 ${meta.surface}`}
                style={{ clipPath: "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0 50%)" }}
              >
                <div>
                  <p className={`text-lg font-black tabular-nums ${meta.tone}`}>
                    {attendanceCounts[status as SelfAttendanceRecord["status"]].toLocaleString(
                      "fa-IR",
                    )}
                  </p>
                  <p className={`mt-0.5 text-[10px] font-bold ${meta.tone}`}>{meta.label}</p>
                </div>
              </div>
            ))}
          </div>
          {attendanceSummary.data?.message ? (
            <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-500">
              {attendanceSummary.data.message}
            </p>
          ) : null}
        </button>
      </div>

      <div className="mt-3">
        <AnnouncementEnvelope announcements={home.data?.home?.announcements} />
      </div>
      <div
        className="mt-6 flex min-h-24 items-center justify-center gap-4 px-2 text-amber-800 dark:text-amber-200 sm:min-h-28 sm:gap-5"
        aria-label="موجودی سکه"
      >
        <AttendanceCoin className="size-16 shrink-0 object-contain sm:size-20" />
        <strong className="text-4xl font-black tabular-nums sm:text-5xl">
          {attendancePoints.toLocaleString("fa-IR")}
        </strong>
        <span className="text-base font-black sm:text-lg">سکه</span>
      </div>
      <StudentAttendanceProfileDrawer
        open={attendanceProfileOpen}
        onOpenChange={setAttendanceProfileOpen}
        points={attendancePoints}
        scope={attendanceScope}
      />
    </section>
  );
}

function useStudentClassStartAlert(nextClass: NextStudentClass | null) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "unsupported",
  );

  useEffect(() => {
    if (!nextClass || permission !== "granted" || typeof window === "undefined") return;
    const startsAt = new Date(nextClass.startsAt).getTime();
    const delay = startsAt - Date.now();
    const reminderKey = `student-class-start:${nextClass.id}:${nextClass.date}`;
    if (delay <= 0 || window.sessionStorage.getItem(reminderKey)) return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(reminderKey, "1");
      const title = "کلاس شما شروع شد";
      const body = `${nextClass.title}${nextClass.room ? ` · ${nextClass.room}` : ""}`;
      notifications.info(title, { description: body, duration: 8_000 });
      try {
        new Notification(title, { body, tag: reminderKey });
      } catch {
        // The in-app notice above remains available if the browser rejects a system alert.
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [nextClass, permission]);

  return {
    canEnable: Boolean(nextClass && permission === "default"),
    enable: async () => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        notifications.error("مرورگر شما اعلان سیستمی را پشتیبانی نمی‌کند.");
        return;
      }
      const next = await Notification.requestPermission();
      setPermission(next);
      if (next === "granted") {
        notifications.success("یادآور شروع کلاس فعال شد.");
      } else if (next === "denied") {
        notifications.error("اجازهٔ اعلان در تنظیمات مرورگر مسدود شده است.");
      }
    },
  };
}
