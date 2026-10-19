import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, ClipboardCheck, MessageSquare, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../identity/auth";
import { getAttendanceOverview } from "../../../student-life/attendance/public";
import { listSchedule } from "../../../academics/schedule/api/schedule.api";
import { DashboardCalendar } from "../../dashboard/components/DashboardCalendar";
import { todayIso } from "../../../../shared/lib/utils";
import { notify } from "../../../../shared/ui/notifications";
import { api } from "../../../../shared/api/api";
import { Button, Card, Input, LoadingState, Textarea } from "../../../../shared/ui/ui";
import {
  createAnnouncement,
  getPrayerTimes,
  listAnnouncements,
  type SchoolAnnouncement,
  updateAnnouncement,
} from "../api/school-home.api";
import { CurrentPrayerCard } from "./CurrentPrayerCard";
import { SchoolOccupancyBanner } from "./SchoolOccupancyBanner";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { useAdminNotifications } from "../../../communications/notifications/hooks/useAdminNotifications";
import { notificationAdminUrl } from "../../../communications/notifications/model/notification-model";

/** Principal and supervisor home: school calendar, live prayer time, announcements and attendance totals. */
export function SchoolManagerDashboard() {
  const auth = useAuth();
  const client = useQueryClient();
  const [date, setDate] = useState(todayIso);
  const [announcementsOpen, setAnnouncementsOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
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
  const [announcement, setAnnouncement] = useState<{
    title: string;
    body: string;
    audience: "STAFF" | "STUDENTS";
    status: "ACTIVE";
  }>({
    title: "",
    body: "",
    audience: "STUDENTS" as const,
    status: "ACTIVE" as const,
  });
  const prayerValues = prayer.data?.times;
  const publish = useMutation({
    mutationFn: () => {
      if (!organizationId) throw new Error("مدرسه فعال مشخص نیست.");
      return createAnnouncement(organizationId, announcement);
    },
    onSuccess: () => {
      setAnnouncement({ title: "", body: "", audience: "STUDENTS", status: "ACTIVE" });
      void client.invalidateQueries({ queryKey: ["announcements"] });
      notify("اعلان منتشر شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "انتشار اعلان انجام نشد.", "error"),
  });
  const archiveAnnouncement = useMutation({
    mutationFn: (item: SchoolAnnouncement) =>
      updateAnnouncement(item.id, {
        title: item.title,
        body: item.body,
        audience: item.audience,
        classroomId: item.classroomId,
        status: "ARCHIVED",
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["announcements", organizationId] });
      notify("اعلان بایگانی شد.", "success");
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "بایگانی اعلان انجام نشد.", "error"),
  });
  const totals = attendance.data ?? { present: 0, absent: 0, late: 0, excused: 0 };

  useEffect(() => {
    const events = api.openEvents((type, event) => {
      if (type !== "attendance.updated" || event.organizationId !== organizationId) return;
      void client.invalidateQueries({ queryKey: ["attendance-overview"] });
    });
    return () => events.close();
  }, [client, organizationId]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const activeAnnouncements = useMemo(
    () => (announcements.data ?? []).filter((item) => item.status === "ACTIVE"),
    [announcements.data],
  );
  const canReviewIncomingWork = auth.canAny(["permission_requests.read", "leave.read"]);

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
      <div className="">
        <SchoolOccupancyBanner />
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
        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-ink">اعلان‌های مدرسه</h2>
              <p className="mt-1 text-xs text-slate-500">
                {activeAnnouncements.length.toLocaleString("fa-IR")} اعلان فعال
              </p>
            </div>
            <Button onClick={() => setAnnouncementsOpen(true)}>
              <BellRing size={16} /> مدیریت اعلان‌ها
            </Button>
          </div>
        </Card>
        {canReviewIncomingWork ? <SchoolIncomingPanel /> : null}
        <ResponsiveDrawer
          open={announcementsOpen}
          onOpenChange={setAnnouncementsOpen}
          title="اعلان‌های مدرسه"
          description="اعلان‌ها حداکثر ۲۴ ساعت پس از انتشار فعال هستند."
        >
          <div className="grid gap-4">
            {auth.can("announcements.manage") ? (
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <BellRing className="text-brand" size={19} />
                  <h2 className="font-black text-ink">اعلان جدید</h2>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Input
                    placeholder="عنوان اعلان"
                    value={announcement.title}
                    onChange={(event) =>
                      setAnnouncement((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                  <select
                    className="h-10 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 text-sm"
                    value={announcement.audience}
                    onChange={(event) =>
                      setAnnouncement((current) => ({
                        ...current,
                        audience: event.target.value as "STAFF" | "STUDENTS",
                      }))
                    }
                  >
                    <option value="STUDENTS">دانش‌آموزان</option>
                    <option value="STAFF">کارکنان</option>
                  </select>
                </div>
                <Textarea
                  className="mt-2"
                  placeholder="متن اعلان"
                  value={announcement.body}
                  onChange={(event) =>
                    setAnnouncement((current) => ({ ...current, body: event.target.value }))
                  }
                />
                <Button
                  className="mt-2"
                  disabled={!announcement.title.trim() || !announcement.body.trim()}
                  loading={publish.isPending}
                  onClick={() => publish.mutate()}
                >
                  انتشار اعلان
                </Button>
              </Card>
            ) : null}
            {activeAnnouncements.length ? (
              <Card className="p-4" aria-label="اعلان‌های فعال مدرسه">
                <h2 className="font-black text-ink">اعلان‌های فعال</h2>
                <div className="mt-3 grid gap-2">
                  {activeAnnouncements.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl bg-[rgb(var(--surface-muted))] p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-ink">{item.title}</h3>
                        {auth.can("announcements.manage") && item.status !== "ARCHIVED" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            loading={archiveAnnouncement.isPending}
                            aria-label={`بایگانی اعلان ${item.title}`}
                            onClick={() => archiveAnnouncement.mutate(item)}
                          >
                            بایگانی
                          </Button>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
                      {item.expiresAt ? (
                        <p className="mt-2 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                          {remainingAnnouncementTime(item.expiresAt, now)}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </Card>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">اعلان فعالی وجود ندارد.</p>
            )}
            <p className="text-xs text-slate-500">
              بایگانی‌ها پس از پایان زمان در تاریخچه سرور قابل فیلتر خواهند بود.
            </p>
          </div>
        </ResponsiveDrawer>
      </div>
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

function remainingAnnouncementTime(expiresAt: string, now: number) {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return remaining
    ? `باقی‌مانده: ${hours.toLocaleString("fa-IR")}:${minutes.toLocaleString("fa-IR")} ساعت`
    : "زمان اعلان به پایان رسیده است";
}
