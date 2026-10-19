import { BookOpen, CalendarCheck2, CalendarDays, Medal, MoreHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../../features/identity/auth";
import { cn } from "../../../../shared/lib/utils";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { useAdminShellCopy, useLocale } from "../../../../shared/ui/locale";
import type { AdminPerformanceProfile } from "../../lib/device-performance";
import type { AdminCurrentNavigation } from "../../model/layout-types";
import {
  adminDestination,
  localizedMainNavigationForCapabilities,
  localizedNavigationForCapabilities,
} from "../config/admin-navigation";
import { ThemeSwitcher } from "@/shared/theme/theme";
import { GlassActiveIndicator } from "../../../../shared/ui/glass/GlassActiveIndicator";
import { getAttendanceEncouragement } from "../../../../features/student-life/attendance/public";
import { AchievementCountdown } from "../../../../features/achievements";

const MAX_PRIMARY_DESTINATIONS = 4;

/** Phone renderer for the shared capability-derived Admin navigation. */
export function AdminMobileBottomNav({
  current,
  selectedStudentId,
  performance,
}: {
  current: AdminCurrentNavigation;
  selectedStudentId: string;
  performance: AdminPerformanceProfile;
}) {
  const auth = useAuth();
  const { language, profile } = useLocale();
  const copy = useAdminShellCopy();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isStudentNavigation = auth.activeRole === "STUDENT";
  const primaryItems = localizedMainNavigationForCapabilities(
    auth.capabilities,
    auth.activeRole,
    language,
  ).slice(0, MAX_PRIMARY_DESTINATIONS);
  const navigationGroups = localizedNavigationForCapabilities(
    auth.capabilities,
    auth.activeRole,
    language,
  );
  const activePrimaryIndex = primaryItems.findIndex(
    ({ path, section }) => current.sectionKey === section || (path === "" && current.path === ""),
  );

  useEffect(() => setSheetOpen(false), [location.pathname]);

  return (
    <>
      <nav
        aria-label={language === "fa" ? "ناوبری اصلی" : "Primary navigation"}
        className={cn(
          "admin-mobile-bottom-nav fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-30 flex rounded-[1.5rem] border border-[rgb(var(--glass-border))] bg-[rgb(var(--glass-bg))] px-1 py-1 shadow-[var(--glass-shadow)] supports-[backdrop-filter]:bg-[rgb(var(--glass-bg))] sm:inset-x-3",
          performance === "enhanced" && "backdrop-blur-md",
        )}
      >
        <GlassActiveIndicator index={activePrimaryIndex} count={primaryItems.length + 1} />
        {primaryItems.map(({ path, section, title, icon: Icon }) => {
          const active = current.sectionKey === section || (path === "" && current.path === "");
          return (
            <NavLink
              key={path}
              to={adminDestination(path, section, selectedStudentId)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "student-mobile-nav-item relative z-10 grid min-h-14 min-w-0 flex-1 place-items-center gap-1 rounded-[1.15rem] px-0.5 text-center text-[10px] font-semibold leading-none outline-none transition-[color,transform] duration-200 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.96]",
                active ? " text-brand" : "text-slate-500 dark:text-slate-300",
              )}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="max-w-full truncate leading-tight">{title}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          aria-controls="admin-mobile-navigation-sheet"
          aria-expanded={sheetOpen}
          aria-label={copy.allRoutes}
          onClick={() => setSheetOpen(true)}
          className={cn(
            "relative z-10 grid min-h-14 min-w-0 flex-1 place-items-center gap-1 rounded-[1.15rem] px-0.5 text-center text-[10px] font-semibold leading-none text-slate-500 outline-none transition-[color,transform] duration-200 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.96] dark:text-slate-300",
          )}
        >
          <MoreHorizontal size={21} aria-hidden="true" />
          <span className="max-w-full truncate leading-tight">
            {language === "fa" ? "بیشتر" : "More"}
          </span>
        </button>
      </nav>

      <ResponsiveDrawer
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={copy.allRoutes}
        description={
          language === "fa"
            ? "بخش‌های در دسترس با نقش فعلی شما"
            : "Sections available to your current role"
        }
        className="md:hidden"
      >
        <div className="flex items-center justify-between border rounded-lg p-1 px-2 mb-1 border-gray-300 dark:border-green-900">
          <p className="">تغییر حالت صفحه</p>
          <ThemeSwitcher />
        </div>
        <aside id="admin-mobile-navigation-sheet" dir={profile.direction} className="grid gap-5">
          <NavLink
            to="/admin/achievements"
            onClick={() => setSheetOpen(false)}
            className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand"
          >
            <span className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-white/10">
                <Medal size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 text-start">
                <strong className="block text-sm">دستاوردها</strong>
                <span className="mt-1 block text-xs text-slate-300">
                  نشان‌ها به‌زودی فعال می‌شوند
                </span>
              </span>
            </span>
            <AchievementCountdown compact />
          </NavLink>
          {isStudentNavigation ? (
            <StudentMoreDrawerHeader
              capabilities={auth.capabilities}
              activeRole={auth.activeRole}
              userId={auth.user?.id}
              organizationId={auth.context?.activeOrganization?.id}
              onNavigate={() => setSheetOpen(false)}
            />
          ) : null}
          {navigationGroups.map((group) => (
            <section
              key={group.sectionKey}
              aria-labelledby={`mobile-navigation-${group.sectionKey}`}
            >
              <h2
                id={`mobile-navigation-${group.sectionKey}`}
                className="mb-2 text-xs font-black text-slate-500 dark:text-slate-300"
              >
                {group.section}
              </h2>
              <div className="grid gap-2">
                {group.items.map(({ path, title, description, icon: Icon }) => {
                  const active = current.path === path;
                  return (
                    <NavLink
                      key={path}
                      to={adminDestination(path, group.sectionKey, selectedStudentId)}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 text-start outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-brand",
                        active
                          ? "border-brand/35 bg-brand/10"
                          : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] hover:bg-[rgb(var(--surface-muted))]",
                      )}
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm text-ink">{title}</strong>
                        <span className="mt-1 block line-clamp-1 text-xs text-slate-500 dark:text-slate-300">
                          {description}
                        </span>
                      </span>
                      {active ? <X size={16} className="text-brand" aria-hidden="true" /> : null}
                    </NavLink>
                  );
                })}
              </div>
            </section>
          ))}
        </aside>
      </ResponsiveDrawer>
    </>
  );
}

function StudentMoreDrawerHeader({
  capabilities,
  activeRole,
  userId,
  organizationId,
  onNavigate,
}: {
  capabilities: readonly string[];
  activeRole: string | null | undefined;
  userId?: string;
  organizationId?: string;
  onNavigate: () => void;
}) {
  const canReadAttendance = capabilities.includes("attendance.self.read");
  const points = useQuery({
    queryKey: ["attendance-encouragement", userId, activeRole, organizationId],
    queryFn: getAttendanceEncouragement,
    enabled: canReadAttendance,
  });
  const actions = [
    canReadAttendance ? { path: "my-attendance", label: "حضور من", icon: CalendarCheck2 } : null,
    capabilities.includes("schedule.read")
      ? { path: "schedule", label: "برنامه هفتگی", icon: CalendarDays }
      : null,
    { path: "books", label: "کتاب‌ها", icon: BookOpen },
  ].filter((action): action is NonNullable<typeof action> => action !== null);

  return (
    <div className="grid gap-3">
      <NavLink
        to="/admin/my-attendance"
        onClick={onNavigate}
        aria-label="امتیازهای من"
        className="flex min-h-20 items-center gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-3 text-amber-950 outline-none transition hover:border-amber-400 hover:bg-amber-100/70 focus-visible:ring-2 focus-visible:ring-brand dark:border-amber-700/70 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-950/50"
      >
        <img
          src="/images/mascots/zanin-coin.svg"
          alt=""
          aria-hidden="true"
          className="size-14 shrink-0"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold">امتیازهای من</span>
          <strong className="mt-1 block text-2xl font-black tabular-nums">
            {points.isLoading
              ? "…"
              : ((points.data as { points?: number } | undefined)?.points ?? 0).toLocaleString(
                  "fa-IR",
                )}
          </strong>
        </span>
        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">جزئیات</span>
      </NavLink>

      <section aria-labelledby="student-fast-actions">
        <h2
          id="student-fast-actions"
          className="mb-2 text-xs font-black text-slate-500 dark:text-slate-300"
        >
          دسترسی سریع
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {actions.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={`/admin/${path}`}
              onClick={onNavigate}
              className="grid min-h-24 place-items-center gap-1 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-2 py-3 text-center text-[11px] font-bold text-ink outline-none transition hover:border-brand/35 hover:bg-brand/5 focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.98]"
            >
              <Icon size={20} className="text-brand" aria-hidden="true" />
              <span className="leading-4">{label}</span>
            </NavLink>
          ))}
        </div>
      </section>
    </div>
  );
}
