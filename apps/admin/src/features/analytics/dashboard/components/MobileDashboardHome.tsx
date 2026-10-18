import { BellRing, CalendarClock, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import type { RoleCode } from "../../../../shared/types/domain";
import { MobileCard } from "../../../../shared/ui/mobile";
import { DashboardCalendar } from "./DashboardCalendar";
import { quickActionsForRole, type RoleQuickAction } from "../model/role-experience";
import type { RoleDashboardData } from "../model/dashboard.types.ts";
import { CurrentPrayerCard } from "../../school-home/components/CurrentPrayerCard";

type MobileDashboardHomeProps = {
  data: RoleDashboardData;
  activeRole: string | null | undefined;
  capabilities: readonly string[];
  calendarDate: string;
  onCalendarDateChange: (date: string) => void;
};

type ScheduleEntry = NonNullable<NonNullable<RoleDashboardData["home"]>["currentClass"]>;

/**
 * Mobile's task-focused dashboard. It uses the same dashboard payload and
 * capability list as the desktop workspace, but intentionally avoids the
 * configurable board so the first screen remains useful on a phone.
 */
export function MobileDashboardHome({
  data,
  activeRole,
  capabilities,
  calendarDate,
  onCalendarDateChange,
}: MobileDashboardHomeProps) {
  const role = mobileDashboardRole(data.activeRole ?? activeRole ?? data.context);
  const actions = mobileActions(role, capabilities);
  const dateEntries = entriesForDate(data, calendarDate);
  const currentClass = data.home?.currentClass ?? dateEntries[0] ?? null;
  const nextClass = dateEntries.find((entry) => entry.id !== currentClass?.id) ?? null;
  const prayer = data.home?.prayer;
  const prayerTimes = prayer && "times" in prayer ? prayer.times : null;

  return (
    <section aria-label="خانه موبایل" className="mobile-dashboard grid min-w-0 gap-3">
      <DashboardCalendar
        value={calendarDate}
        onChange={onCalendarDateChange}
        capabilities={capabilities}
        schedule={data.home?.calendar.entries}
      />

      <section aria-label="کلاس‌های امروز" className="grid grid-cols-2 gap-2">
        <ClassCard title="کلاس اکنون" entry={currentClass} emphasized />
        <ClassCard title="کلاس بعدی" entry={nextClass} />
      </section>

      <CurrentPrayerCard times={prayerTimes} />

      {data.home?.announcements?.length ? (
        <MobileCard className="mobile-task-card p-3" aria-label="پیام‌های مدرسه">
          <div className="flex items-center gap-2 text-brand">
            <BellRing size={17} aria-hidden="true" />
            <h2 className="text-sm font-black text-ink">پیام‌های مدرسه</h2>
          </div>
          <div className="mt-3 grid gap-2">
            {data.home.announcements.slice(0, 2).map((announcement) => (
              <article key={announcement.id} className="rounded-lg bg-brand/[0.04] p-2.5">
                <h3 className="text-xs font-bold text-ink">{announcement.title}</h3>
                <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-slate-600 dark:text-slate-300">
                  {announcement.body}
                </p>
              </article>
            ))}
          </div>
        </MobileCard>
      ) : null}

      <nav aria-label="دسترسی سریع" className="grid grid-cols-3 gap-2">
        {actions.map((action) => (
          <Shortcut key={action.to} action={action} />
        ))}
      </nav>
    </section>
  );
}

function ClassCard({
  title,
  entry,
  emphasized = false,
}: {
  title: string;
  entry: ScheduleEntry | null;
  emphasized?: boolean;
}) {
  return (
    <MobileCard
      className={`mobile-task-card ${emphasized ? "border-brand/25 bg-brand/[0.04]" : ""} p-3`}
    >
      <div className="flex items-center gap-2 text-brand">
        <CalendarClock size={16} aria-hidden="true" />
        <h2 className="text-xs font-black text-ink">{title}</h2>
      </div>
      {entry ? (
        <>
          <p className="mt-3 truncate text-sm font-black text-ink">{entry.title}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Clock3 size={12} aria-hidden="true" />
            <span dir="ltr">
              {entry.startTime} – {entry.endTime}
            </span>
          </p>
          {entry.room ? (
            <p className="mt-1 truncate text-[10px] text-slate-500">{entry.room}</p>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-[11px] leading-5 text-slate-500">
          کلاسی برای این بخش از روز ندارید.
        </p>
      )}
    </MobileCard>
  );
}

function Shortcut({ action }: { action: RoleQuickAction }) {
  const Icon = action.icon ?? CalendarClock;
  return (
    <Link
      to={action.to}
      title={action.description}
      className="mobile-quick-action flex min-h-[4.75rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-1 text-center text-slate-600 outline-none transition hover:border-brand/30 hover:bg-brand/[0.04] hover:text-brand focus-visible:ring-2 focus-visible:ring-brand dark:text-slate-300"
    >
      <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
      <span className="line-clamp-2 text-[10px] font-bold leading-4">{action.label}</span>
    </Link>
  );
}

function entriesForDate(data: RoleDashboardData, date: string) {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return (data.home?.calendar.entries ?? [])
    .filter((entry) => entry.weekday === weekday)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

function mobileDashboardRole(role: string): RoleCode {
  if (
    [
      "PRINCIPAL",
      "SCHOOL_ADMIN",
      "SCHOOL_SUPERVISOR",
      "DISCIPLINARIAN",
      "RELIGIOUS_EDUCATION_MANAGER",
      "GOVERNMENT_EDUCATION_MANAGER",
    ].includes(role)
  )
    return "ORGANIZATION_ADMIN";
  if (role === "COUNSELOR") return "ADVISOR";
  if (role === "STUDENT_AFFAIRS_MENTOR") return "MENTOR";
  return role as RoleCode;
}

function mobileActions(role: RoleCode, capabilities: readonly string[]) {
  const actions = quickActionsForRole(role, capabilities);
  return actions.slice(0, 6);
}
