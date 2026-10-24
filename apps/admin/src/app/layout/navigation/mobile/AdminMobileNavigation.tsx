import {
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  Landmark,
  Medal,
  MoreHorizontal,
  Store,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../../features/identity/auth";
import { cn } from "../../../../shared/lib/utils";
import { ResponsiveDrawer } from "../../../../shared/ui/responsive-drawer";
import { AttendanceCoin } from "../../../../shared/ui/attendance-coin";
import { useAdminShellCopy, useLocale } from "../../../../shared/ui/locale";
import type { AdminPerformanceProfile } from "../../lib/device-performance";
import type { AdminCurrentNavigation } from "../../model/layout-types";
import {
  adminDestination,
  localizedMainNavigationForCapabilities,
  localizedNavigationForCapabilities,
} from "../config/admin-navigation";
import { ThemeSwitcher } from "@/shared/theme/theme";
import { getAttendanceEncouragement } from "../../../../features/student-life/attendance/public";
import { AchievementCountdown } from "../../../../features/achievements";
import { COIN_SHOP_RELEASE_AT } from "../../../../features/coin-shop";
// import "./admin-mobile-bottom-nav-3d.css";

const MAX_PRIMARY_DESTINATIONS = 4;

/** Lightweight CSS-only 3D glass navigation; existing routes/permissions preserved. */
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
  const primaryPaths = new Set(primaryItems.map((item) => item.path));
  const navigationGroups = localizedNavigationForCapabilities(
    auth.capabilities,
    auth.activeRole,
    language,
  )
    .filter((group) => !isStudentNavigation || group.sectionKey !== "پیشرفت و سکه")
    .map((group) => ({
      ...group,
      items: isStudentNavigation
        ? group.items.filter((item) => !primaryPaths.has(item.path))
        : group.items,
    }))
    .filter((group) => group.items.length > 0);

  useEffect(() => setSheetOpen(false), [location.pathname]);

  return (
    <>
      <nav
        aria-label={language === "fa" ? "ناوبری اصلی" : "Primary navigation"}
        dir={profile.direction}
        className={cn(
          "admin-mobile-bottom-nav glass-3d-dock fixed inset-x-3 z-30 mx-auto max-w-[460px]",
          performance === "enhanced" && "glass-3d-dock--enhanced",
        )}
      >
        <span className="glass-3d-dock__shine" aria-hidden="true" />
        <div className="glass-3d-dock__items">
          {primaryItems.map(({ path, section, title, icon: Icon }) => {
            const active = current.sectionKey === section || (path === "" && current.path === "");
            return (
              <NavLink
                key={`${section}:${path}`}
                to={adminDestination(path, section, selectedStudentId)}
                aria-label={title}
                title={title}
                aria-current={active ? "page" : undefined}
                className={cn("glass-3d-dock__item", active && "glass-3d-dock__item--active")}
              >
                <span className="glass-3d-dock__orb" aria-hidden="true">
                  <Icon className="glass-3d-dock__icon" size={23} strokeWidth={2.2} />
                </span>
              </NavLink>
            );
          })}
          <button
            type="button"
            aria-controls="admin-mobile-navigation-sheet"
            aria-expanded={sheetOpen}
            aria-label={copy.allRoutes}
            title={copy.allRoutes}
            onClick={() => setSheetOpen(true)}
            className={cn("glass-3d-dock__item", sheetOpen && "glass-3d-dock__item--active")}
          >
            <span className="glass-3d-dock__orb" aria-hidden="true">
              <MoreHorizontal className="glass-3d-dock__icon" size={23} strokeWidth={2.2} />
            </span>
          </button>
        </div>
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
          {auth.activeRole === "PRINCIPAL" ? (
            <NavLink
              to="/admin/management"
              onClick={() => setSheetOpen(false)}
              className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-brand"
            >
              <span className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-white/10">
                  <Landmark size={20} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 text-start">
                  <strong className="block text-sm">مدیریت مدرسه</strong>
                  <span className="mt-1 block text-xs text-slate-300">
                    میز یکپارچه مدیریت به‌زودی فعال می‌شود
                  </span>
                </span>
              </span>
            </NavLink>
          ) : null}
          {isStudentNavigation ? (
            <StudentMoreDrawerHeader
              capabilities={auth.capabilities}
              activeRole={auth.activeRole}
              userId={auth.user?.id}
              userName={auth.user?.username}
              organizationId={auth.context?.activeOrganization?.id}
              primaryPaths={primaryPaths}
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
  userName,
  organizationId,
  primaryPaths,
  onNavigate,
}: {
  capabilities: readonly string[];
  activeRole: string | null | undefined;
  userId?: string;
  userName?: string;
  organizationId?: string;
  primaryPaths: ReadonlySet<string>;
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
  ]
    .filter((action): action is NonNullable<typeof action> => action !== null)
    .filter((action) => !primaryPaths.has(action.path));
  const actionTones = [
    "from-violet-500 to-fuchsia-500 text-white shadow-violet-500/25",
    "from-cyan-500 to-blue-600 text-white shadow-cyan-500/25",
    "from-amber-400 to-orange-500 text-slate-950 shadow-orange-500/25",
  ];

  return (
    <div className="grid gap-3">
      <div className="relative overflow-hidden rounded-3xl bg-[#0B1020] px-4 py-3 text-white shadow-xl shadow-indigo-950/25">
        <span
          className="absolute -end-8 -top-8 size-28 rounded-full bg-cyan-400/30 blur-2xl"
          aria-hidden="true"
        />
        <span
          className="absolute -bottom-8 start-1/3 size-24 rounded-full bg-violet-500/35 blur-2xl"
          aria-hidden="true"
        />
        <p className="relative text-[11px] font-black tracking-[0.16em] text-cyan-200">
          STUDENT SPACE
        </p>
        <p className="relative mt-1 text-base font-black">
          {userName ? `سلام، ${userName}` : "مسیر پیشرفت من"}
        </p>
      </div>
      <NavLink
        to="/admin/my-attendance"
        onClick={onNavigate}
        aria-label="سکه‌های من"
        className="relative flex min-h-[4.75rem] items-center gap-3 overflow-hidden rounded-3xl border border-amber-200/35 bg-gradient-to-l from-amber-400 via-orange-400 to-rose-500 px-4 text-white shadow-lg shadow-orange-500/20 outline-none transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-cyan-200 motion-reduce:transition-none"
      >
        <span
          className="absolute -start-8 top-0 size-24 rounded-full bg-white/20 blur-2xl"
          aria-hidden="true"
        />
        <AttendanceCoin className="size-12 shrink-0 object-contain" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-white/90">سکه‌های من</span>
          <strong className="block text-xl font-black tabular-nums">
            {points.isLoading
              ? "…"
              : ((points.data as { points?: number } | undefined)?.points ?? 0).toLocaleString(
                  "fa-IR",
                )}
          </strong>
        </span>
        <ChevronLeft size={18} className="text-white/80" aria-hidden="true" />
      </NavLink>

      <section aria-label="دستاوردها و بازار سکه">
        <div className="grid gap-2 sm:grid-cols-2">
          <NavLink
            to="/admin/achievements"
            onClick={onNavigate}
            className="relative grid min-h-28 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 overflow-hidden rounded-3xl border border-cyan-200/30 bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-3 text-white shadow-lg shadow-blue-500/20 outline-none transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-cyan-200 motion-reduce:transition-none"
          >
            <span className="row-span-2 grid size-10 place-items-center rounded-2xl bg-white/15 text-white">
              <Medal size={20} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 items-center justify-between gap-2 text-start">
              <strong className="text-xs">دستاوردها</strong>
              <ChevronLeft size={16} className="shrink-0 text-white/80" aria-hidden="true" />
            </span>
            <AchievementCountdown compact />
          </NavLink>
          <NavLink
            to="/admin/coin-shop"
            onClick={onNavigate}
            className="relative grid min-h-28 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 overflow-hidden rounded-3xl border border-violet-200/30 bg-gradient-to-br from-violet-500 via-fuchsia-600 to-pink-600 p-3 text-white shadow-lg shadow-fuchsia-500/20 outline-none transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-cyan-200 motion-reduce:transition-none"
          >
            <span className="row-span-2 grid size-10 place-items-center rounded-2xl bg-white/15 text-white">
              <Store size={20} aria-hidden="true" />
            </span>
            <span className="flex min-w-0 items-center justify-between gap-2 text-start">
              <strong className="text-xs">بازار سکه</strong>
              <ChevronLeft size={16} className="shrink-0 text-white/80" aria-hidden="true" />
            </span>
            <AchievementCountdown
              compact
              releaseAt={COIN_SHOP_RELEASE_AT}
              ariaLabel="زمان باقی‌مانده تا باز شدن بازار سکه؛ روز، ساعت، دقیقه، ثانیه"
            />
          </NavLink>
        </div>
      </section>

      {actions.length ? (
        <section aria-label="دسترسی‌های بیشتر">
          <div className="grid grid-cols-3 gap-2">
            {actions.map(({ path, label, icon: Icon }, index) => (
              <NavLink
                key={path}
                to={`/admin/${path}`}
                onClick={onNavigate}
                className={`grid min-h-[4.5rem] place-items-center gap-1 rounded-2xl bg-gradient-to-br px-2 py-2 text-center text-[11px] font-bold shadow-lg outline-none transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none ${actionTones[index % actionTones.length]}`}
              >
                <Icon size={19} aria-hidden="true" />
                <span className="leading-4">{label}</span>
              </NavLink>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
