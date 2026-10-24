import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  CalendarCheck2,
  ChevronLeft,
  Clock3,
  LockKeyhole,
  Medal,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  getAttendanceEncouragement,
  type SelfAttendanceRecord,
} from "../../../student-life/attendance/public";
import { useAuth } from "../../../identity/auth";
import { fa, todayIso } from "../../../../shared/lib/utils";
import { useLocale } from "../../../../shared/ui/locale";
import { Card, EmptyState, LoadingState } from "../../../../shared/ui/ui";
import { AttendanceCoin } from "../../../../shared/ui/attendance-coin";
import { AchievementCountdown } from "../../../achievements";
import { CoinShopTeaser } from "../../../coin-shop";
import { CurrentPrayerCard } from "../../school-home/components/CurrentPrayerCard";
import { getAdminDashboard } from "../api/dashboard.api";
import { AnnouncementEnvelope } from "./AnnouncementEnvelope";
import { StudentAttendanceProfileDrawer } from "../../../student-life/attendance/components/StudentAttendanceProfileDrawer";

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
  const attendanceCounts = attendanceSummary.data ?? { present: 0, absent: 0, late: 0, excused: 0 };
  const attendancePoints = (attendanceSummary.data as { points?: number } | undefined)?.points ?? 0;
  const prayer = home.data?.home?.prayer;
  const prayerTimes = prayer && "times" in prayer ? prayer.times : null;
  // The dashboard is a live "now" view. The complete timetable remains on
  // its dedicated route, so never substitute the first scheduled class here.
  const currentClass = home.data?.home?.currentClass ?? null;
  const firstName = auth.user?.firstName || auth.user?.displayName || "دانش‌آموز";
  const [attendanceProfileOpen, setAttendanceProfileOpen] = useState(false);
  const attendanceScope = JSON.stringify([
    auth.user?.id,
    auth.activeRole,
    auth.context?.activeOrganization?.id,
  ]);

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

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,.72fr)]">
        <Card
          className="student-dashboard__surface min-w-0 overflow-hidden p-4"
          aria-label="کلاس جاری"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
                <Clock3 size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-black text-ink">کلاس همین حالا</h2>
                <p className="truncate text-[11px] text-slate-500">بر اساس ساعت جاری تهران</p>
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
            <div className="mt-3 flex min-w-0 items-center gap-2 rounded-2xl bg-[rgb(var(--surface-muted))] px-3 py-3">
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
            <p className="mt-4 text-xs text-slate-500">در این ساعت کلاسی ندارید.</p>
          )}
        </Card>
        <CurrentPrayerCard
          times={prayerTimes}
          className="student-dashboard__prayer min-w-0 px-3 py-3"
        />
      </div>

      <div className="mt-3">
        <Card
          className="student-dashboard__surface min-h-0 overflow-hidden p-4"
          aria-label="خلاصه حضور و غیاب"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarCheck2 size={17} className="text-brand" aria-hidden="true" />
              <h2 className="text-xs font-black text-ink">حضور من</h2>
            </div>
            <button
              type="button"
              onClick={() => setAttendanceProfileOpen(true)}
              className="text-[11px] font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              جزئیات
            </button>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {Object.entries(attendanceMeta).map(([status, meta]) => (
              <div
                key={status}
                className="rounded-xl bg-[rgb(var(--surface-muted))] px-1 py-2 text-center"
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
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <span className="flex items-center gap-1 text-[11px] font-bold">
              <AttendanceCoin className="size-5 object-contain" />
              سکه‌ها
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

      <section
        className="mt-3 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4 text-white shadow-sm sm:p-5"
        aria-labelledby="student-achievements-title"
      >
        <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,.72fr)]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-amber-300">
                <Medal size={19} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.16em] text-slate-400">
                  ویژگی آینده
                </p>
                <h2
                  id="student-achievements-title"
                  className="mt-0.5 text-sm font-black sm:text-base"
                >
                  دستاوردهای من
                </h2>
              </div>
            </div>
            <p className="mt-3 max-w-xl text-xs leading-6 text-slate-300">
              نشان‌ها و مسیر پیشرفت شما به‌زودی فعال می‌شوند. از همین‌جا می‌توانید نشان‌های در راه
              را ببینید.
            </p>
            <Link
              to="/admin/achievements"
              className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-xl bg-white px-3 text-xs font-black text-slate-950 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              دیدن دستاوردها <ChevronLeft size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <LockKeyhole size={15} className="text-slate-400" aria-hidden="true" />
              تا باز شدن دستاوردها
            </div>
            <AchievementCountdown compact />
          </div>
        </div>
      </section>

      <CoinShopTeaser audience="student" className="mt-3" />

      <div className="mt-3">
        <AnnouncementEnvelope announcements={home.data?.home?.announcements} />
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
