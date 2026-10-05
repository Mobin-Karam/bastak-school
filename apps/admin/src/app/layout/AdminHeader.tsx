import { ChevronLeft, ChevronRight, Home, Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { HeaderClock } from "../../features/clock";
import { HeaderNotifications } from "../../features/notifications";
import { ThemeSwitcher } from "../../shared/theme/theme";
import { WorkContextBar } from "../../shared/ui/work-context-bar";
import { adminDestination, resolveAdminNavigation } from "./admin-navigation";
import { AdminAccountMenu } from "./AdminAccountMenu";
import { AdminLanguageSwitcher } from "./AdminLanguageSwitcher";
import type { AdminBreadcrumb, AdminCurrentNavigation } from "./layout-types";
import { useAdminShellCopy, useLocale } from "../../shared/ui/locale";

export function AdminHeader({
  current,
  breadcrumbs,
  selectedStudentId,
  sticky = true,
  onOpenMobileNavigation,
  role,
  organization,
  multipleRoles,
  showStudent,
}: {
  current: AdminCurrentNavigation;
  breadcrumbs: AdminBreadcrumb[];
  selectedStudentId: string;
  sticky?: boolean;
  onOpenMobileNavigation: () => void;
  role: string;
  organization?: string;
  multipleRoles?: boolean;
  showStudent?: boolean;
}) {
  const { profile } = useLocale();
  const copy = useAdminShellCopy();
  const BreadcrumbChevron = profile.direction === "rtl" ? ChevronLeft : ChevronRight;
  return (
    <header
      className={`${sticky ? "sticky top-0" : "relative"} z-30 border-b border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card)_/_94%)] text-slate-900 backdrop-blur-md dark:text-slate-100`}
    >
      <div className="flex min-h-14 items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            onClick={onOpenMobileNavigation}
            aria-label={copy.openNavigation}
          >
            <Menu size={19} />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-row gap-6">
                <strong className="block truncate text-sm sm:text-base">{current.title}</strong>
                <nav
                  aria-label={copy.pageLocation}
                  className="mb-0.5 hidden min-w-0 items-center gap-1 text-[10px] text-slate-400 md:flex"
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
                            to={adminDestination(item.path, destination.section, selectedStudentId)}
                          >
                            {item.title}
                          </NavLink>
                        )}
                      </span>
                    );
                  })}
                </nav>
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
          </div>
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderClock />
          <AdminLanguageSwitcher />
          <div className="hidden xl:block">
            <ThemeSwitcher />
          </div>
          <HeaderNotifications />
          <AdminAccountMenu />
        </div>
      </div>
    </header>
  );
}
