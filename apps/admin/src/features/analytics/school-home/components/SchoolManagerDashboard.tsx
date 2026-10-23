import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BedDouble,
  BellRing,
  CalendarClock,
  ClipboardCheck,
  Layers3,
  MessageSquare,
  School,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../identity/auth";
import { getAttendanceOverview } from "../../../student-life/attendance/public";
import { listSchedule } from "../../../academics/schedule/api/schedule.api";
import { DashboardCalendar } from "../../dashboard/components/DashboardCalendar";
import { todayIso } from "../../../../shared/lib/utils";
import { api } from "../../../../shared/api/api";
import { Card, LoadingState } from "../../../../shared/ui/ui";
import { getPrayerTimes, listAnnouncements } from "../api/school-home.api";
import { CurrentPrayerCard } from "./CurrentPrayerCard";
import { SchoolOccupancyBanner } from "./SchoolOccupancyBanner";
import { useAdminNotifications } from "../../../communications/notifications/hooks/useAdminNotifications";
import { notificationAdminUrl } from "../../../communications/notifications/model/notification-model";
import { useDevicePerformance } from "../../../../app/layout/hooks/use-device-performance";
import { CoinShopTeaser } from "../../../coin-shop";
import { PrincipalDashboard } from "./PrincipalDashboard";

/** Principal and supervisor home: school calendar, live prayer time, announcements and attendance totals. */
export function SchoolManagerDashboard() {
  const auth = useAuth();
  return auth.activeRole === "PRINCIPAL" ? (
    <>
      <PrincipalDashboard />
      <SchoolOperationsDashboard principalMode />
    </>
  ) : (
    <SchoolOperationsDashboard />
  );
}
function SchoolOperationsDashboard({ principalMode = false }: { principalMode?: boolean }) {
  const auth = useAuth();
  const client = useQueryClient();
  const [date, setDate] = useState(todayIso);
  const organizationId =
    auth.context?.activeOrganization?.id ?? auth.context?.availableOrganizations[0]?.id;
  const schedule = useQuery({ queryKey: ["schedule", "manager"], queryFn: listSchedule });
  const prayer = useQuery({
    queryKey: ["prayer-times", organizationId],
    queryFn: () => getPrayerTimes(organizationId),
    enabled: Boolean(organizationId),
  });
  const announcements = useQuery({
    queryKey: ["announcements", organizationId],
    queryFn: () => listAnnouncements(organizationId),
    enabled: Boolean(organizationId),
  });
  const attendance = useQuery({
    queryKey: ["attendance-overview", auth.user?.id, auth.activeRole, organizationId],
    queryFn: getAttendanceOverview,
    enabled: auth.can("attendance.review"),
    refetchInterval: (query) =>
      Math.min(
        60000,
        Math.max(
          100,
          query.state.data
            ? new Date(query.state.data.resetsAt).getTime() - Date.now() + 50
            : 60000,
        ),
      ),
  });
  const prayerValues = prayer.data?.times;
  const totals = attendance.data ?? { present: 0, absent: 0, late: 0, excused: 0 };

  useEffect(() => {
    const events = api.openEvents((type, event) => {
      if (type !== "attendance.updated" || event.organizationId !== organizationId) return;
      void client.invalidateQueries({ queryKey: ["attendance-overview"] });
    });
    return () => events.close();
  }, [client, organizationId]);
  const activeAnnouncements = useMemo(
    () => (announcements.data ?? []).filter((item) => item.status === "ACTIVE"),
    [announcements.data],
  );
  const canReviewIncomingWork = auth.canAny(["permission_requests.read", "leave.read"]);
  const isSupervisorAttendanceWorkspace =
    auth.activeRole === "SCHOOL_SUPERVISOR" && auth.can("attendance.read");

  if (schedule.isLoading) return <LoadingState label="در حال آماده‌سازی میز مدرسه…" />;
  return (
    <section className="home-workspace mx-auto grid w-full max-w-6xl gap-3" dir="rtl">
      <div className="w-full">
        <DashboardCalendar
          value={date}
          onChange={setDate}
          capabilities={auth.capabilities}
          schedule={schedule.data ?? []}
        />
      </div>
      {principalMode ? null : <CoinShopTeaser audience="school" />}
      <div className="">
        {!principalMode && isSupervisorAttendanceWorkspace ? (
          <SupervisorAttendanceLaunchpad />
        ) : null}
        <SchoolOccupancyBanner />
        {!principalMode ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <CurrentPrayerCard times={prayerValues} className="h-full" />
            <Card className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <UsersRound className="text-brand" size={19} />
                  <h2 className="font-black text-ink">خلاصه حضور مدرسه</h2>
                </div>
                <Link to="/admin/attendance" className="text-xs font-bold text-brand">
                  مدیریت حضور
                </Link>
              </div>
              <p className="mt-2 text-xs leading-6 text-slate-500">
                خلاصه روز جاری از ساعت ۱۶ به وقت تهران؛ سوابق حضور حفظ می‌شوند.
              </p>
              {attendance.isError ? (
                <p role="alert" className="mt-2 text-sm text-rose-600">
                  خلاصه حضور دریافت نشد.{" "}
                  <button type="button" onClick={() => void attendance.refetch()}>
                    تلاش مجدد
                  </button>
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                {[
                  ["حاضر", totals.present, "bg-emerald-50 text-emerald-700"],
                  ["غایب", totals.absent, "bg-rose-50 text-rose-700"],
                  ["تأخیر", totals.late, "bg-amber-50 text-amber-700"],
                  ["موجه", totals.excused, "bg-sky-50 text-sky-700"],
                ].map(([label, value, style]) => (
                  <div key={String(label)} className={`rounded-xl p-2 ${style}`}>
                    <b className="block text-base">{Number(value).toLocaleString("fa-IR")}</b>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : null}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-ink">اعلان‌های مدرسه</h2>
              <p className="mt-1 text-xs text-slate-500">
                {activeAnnouncements.length.toLocaleString("fa-IR")} اعلان فعال
              </p>
            </div>
            <Link
              to={
                auth.can("announcements.manage")
                  ? "/admin/announcements/manage"
                  : "/admin/communication/notifications?type=announcement"
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-[1.125rem] text-sm font-semibold text-[rgb(var(--primary-foreground))] transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              <BellRing size={16} /> مدیریت اعلان‌ها
            </Link>
          </div>
        </Card>
        {canReviewIncomingWork || auth.can("chat.read") ? <SchoolIncomingPanel /> : null}
      </div>
    </section>
  );
}

/**
 * A concise starting point for the supervisor's four attendance contexts.
 * The links only select a client-side context; AttendancePage and its API
 * capability checks remain the authority for viewing or changing records.
 */
export function SupervisorAttendanceLaunchpad() {
  const performance = useDevicePerformance();
  const actions = [
    {
      label: "کلاس‌ها",
      description: "حضور و غیاب هر کلاس",
      to: "/admin/attendance?section=class",
      icon: School,
      tone: "class",
    },
    {
      label: "خوابگاه",
      description: "اتاق‌ها و ساکنان",
      to: "/admin/attendance?section=dorm",
      icon: BedDouble,
      tone: "dorm",
    },
    {
      label: "گروه‌های کلاس",
      description: "گروه‌های آموزشی",
      to: "/admin/attendance?section=class_group",
      icon: Layers3,
      tone: "groups",
    },
    {
      label: "جلسات",
      description: "سوابق و بررسی‌ها",
      to: "/admin/attendance?section=sessions",
      icon: CalendarClock,
      tone: "sessions",
    },
  ] as const;

  return (
    <section
      aria-labelledby="supervisor-attendance-title"
      className={`supervisor-attendance-launchpad ${performance === "enhanced" ? "supervisor-attendance-launchpad--enhanced" : ""}`}
    >
      <div className="supervisor-attendance-launchpad__heading">
        <div>
          <p className="supervisor-attendance-launchpad__eyebrow">میز سرپرست</p>
          <h1 id="supervisor-attendance-title">حضور و غیاب مدرسه</h1>
        </div>
        <p>یک زمینه را برای پیگیری حضور امروز انتخاب کنید.</p>
      </div>
      <nav aria-label="بخش‌های حضور و غیاب" className="supervisor-attendance-launchpad__grid">
        {actions.map(({ label, description, to, icon: Icon, tone }) => (
          <Link key={to} to={to} className="supervisor-attendance-card" data-tone={tone}>
            <span className="supervisor-attendance-card__icon" aria-hidden="true">
              <Icon size={22} strokeWidth={2.15} />
            </span>
            <span className="supervisor-attendance-card__copy">
              <strong>{label}</strong>
              <span>{description}</span>
            </span>
            <span className="supervisor-attendance-card__arrow" aria-hidden="true">
              ←
            </span>
          </Link>
        ))}
      </nav>
    </section>
  );
}

/**
 * Keeps school leaders' new messages and request alerts visible at the point
 * where they start their work. Individual notification URLs remain the source
 * of truth for the target screen, so this never bypasses route authorization.
 */
export function SchoolIncomingPanel() {
  const notifications = useAdminNotifications();
  const incoming = notifications.items.filter((item) => !item.isRead).slice(0, 3);

  return (
    <Card className="p-4" aria-labelledby="school-incoming-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <ClipboardCheck size={18} aria-hidden="true" />
          </span>
          <div>
            <h2 id="school-incoming-title" className="font-black text-ink">
              پیگیری‌های ورودی
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              درخواست‌ها و پیام‌های تازه دانش‌آموزان را از همین‌جا باز کنید.
            </p>
          </div>
        </div>
        <Link to="/admin/communication/notifications" className="text-xs font-bold text-brand">
          همه اعلان‌ها
        </Link>
      </div>

      {notifications.loading ? (
        <div className="mt-3 grid gap-2" aria-busy="true" aria-label="در حال دریافت پیگیری‌ها">
          {[1, 2].map((key) => (
            <div
              key={key}
              className="h-14 animate-pulse rounded-xl bg-[rgb(var(--surface-muted))]"
            />
          ))}
        </div>
      ) : notifications.error ? (
        <p role="alert" className="mt-3 text-sm text-rose-600">
          پیگیری‌های ورودی دریافت نشد.{" "}
          <button type="button" className="font-bold underline" onClick={notifications.refresh}>
            تلاش مجدد
          </button>
        </p>
      ) : incoming.length ? (
        <div className="mt-3 divide-y divide-[rgb(var(--border-subtle))]">
          {incoming.map((item) => (
            <Link
              key={item.id}
              to={notificationAdminUrl(item.url ?? undefined)}
              className="flex items-start gap-2 py-3 outline-none transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
            >
              <MessageSquare className="mt-0.5 shrink-0 text-brand" size={16} aria-hidden="true" />
              <span className="min-w-0">
                <strong className="block truncate text-sm text-ink">{item.title}</strong>
                {item.body ? (
                  <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-slate-500">
                    {item.body}
                  </span>
                ) : null}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">درخواست یا پیام خوانده‌نشده‌ای ندارید.</p>
      )}
    </Card>
  );
}
