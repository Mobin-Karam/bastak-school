import { ChevronLeft, ChevronRight, Home } from "lucide-react";
import { NavLink } from "react-router-dom";
import { HeaderClock } from "../../../features/clock";
// import { HeaderNotifications } from "../../../features/notifications";
import { ThemeSwitcher } from "../../../shared/theme/theme";
import { WorkContextBar } from "../../../shared/ui/work-context-bar";
import { PlatformOrganizationPicker } from "../../../shared/ui/platform-organization-picker";
import { adminDestination, resolveAdminNavigation } from "../navigation/config/admin-navigation";
import { AdminAccountMenu } from "./AdminAccountMenu";
import type { AdminBreadcrumb, AdminCurrentNavigation } from "../model/layout-types";
import { useAdminShellCopy, useLocale } from "../../../shared/ui/locale";
import type { AdminPerformanceProfile } from "../lib/device-performance";

export function AdminHeader({
  current,
  breadcrumbs,
  selectedStudentId,
  sticky = true,
  role,
  organization,
  multipleRoles,
  showStudent,
  performance,
}: {
  current: AdminCurrentNavigation;
  breadcrumbs: AdminBreadcrumb[];
  selectedStudentId: string;
  sticky?: boolean;
  role: string;
  organization?: string;
  multipleRoles?: boolean;
  showStudent?: boolean;
  performance: AdminPerformanceProfile;
}) {
  const { profile } = useLocale();
  const copy = useAdminShellCopy();
  const BreadcrumbChevron = profile.direction === "rtl" ? ChevronLeft : ChevronRight;
  return (
    <header
      className={`${sticky ? "sticky top-0" : "relative"} admin-header-surface admin-expensive-surface z-30 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card)_/_94%)] text-slate-900 ${performance === "reduced" ? "" : "backdrop-blur-md"} dark:text-slate-100`}
    >
      <div className="flex min-h-[4.25rem] items-center justify-between gap-2 px-3 py-2 sm:px-4 lg:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="block truncate text-sm font-bold sm:text-base">{current.title}</h1>
                {breadcrumbs.length > 1 ? (
                  <nav
                    aria-label={copy.pageLocation}
                    className="mb-0.5 hidden min-w-0 items-center gap-1 text-xs text-slate-600 dark:text-slate-400 md:flex"
                  >
                    {breadcrumbs.map((item, index) => {
                      const destination = resolveAdminNavigation(item.path);
                      return (
                        <span
                          key={`${item.path}-${index}`}
                          className="flex min-w-0 items-center gap-1"
                        >
                          {index ? (
                            <BreadcrumbChevron className="shrink-0" size={11} />
                          ) : (
                            <Home className="shrink-0" size={11} />
                          )}
                          {index === breadcrumbs.length - 1 ? (
                            <span
                              className="truncate font-semibold text-slate-600 dark:text-slate-300"
                              aria-current="page"
                            >
                              {item.title}
                            </span>
                          ) : (
                            <NavLink
                              className="truncate rounded-sm outline-none transition hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
                              to={adminDestination(
                                item.path,
                                destination.section,
                                selectedStudentId,
                              )}
                            >
                              {item.title}
                            </NavLink>
                          )}
                        </span>
                      );
                    })}
                  </nav>
                ) : null}
              </div>
              <p className="hidden truncate text-[11px] text-slate-500 dark:text-slate-400 xl:block">
                {current.description}
              </p>
            </div>
            <WorkContextBar
              role={role}
              organization={organization}
              multipleRoles={multipleRoles}
              studentId={selectedStudentId}
              showStudent={showStudent}
            />
            <PlatformOrganizationPicker />
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderClock classNameClockMain="hidden min-[1536px]:block" />
          <div className="hidden xl:block">
            <ThemeSwitcher />
          </div>
          {/* <HeaderNotifications /> */}
          <AdminAccountMenu />
        </div>
      </div>
    </header>
  );
}
