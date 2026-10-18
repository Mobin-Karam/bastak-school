import { MoreHorizontal, X } from "lucide-react";
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

  useEffect(() => setSheetOpen(false), [location.pathname]);

  return (
    <>
      <nav
        aria-label={language === "fa" ? "ناوبری اصلی" : "Primary navigation"}
        className={cn(
          "admin-mobile-bottom-nav fixed inset-x-0 bottom-0 z-30 flex border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-8px_22px_rgb(15_23_42_/_8%)] supports-[backdrop-filter]:bg-[rgb(var(--surface-card))]/85",
          performance === "enhanced" && "backdrop-blur-md",
        )}
      >
        {primaryItems.map(({ path, section, title, icon: Icon }) => {
          const active = current.sectionKey === section || (path === "" && current.path === "");
          return (
            <NavLink
              key={path}
              to={adminDestination(path, section, selectedStudentId)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "grid min-h-14 min-w-0 flex-1 place-items-center gap-1 rounded-xl px-1 text-center text-[11px] font-semibold outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-brand",
                active ? "bg-brand/10 text-brand" : "text-slate-500 dark:text-slate-300",
              )}
            >
              <Icon size={20} aria-hidden="true" />
              <span className="max-w-full truncate">{title}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          aria-controls="admin-mobile-navigation-sheet"
          aria-expanded={sheetOpen}
          aria-label={copy.allRoutes}
          onClick={() => setSheetOpen(true)}
          className="grid min-h-14 min-w-0 flex-1 place-items-center gap-1 rounded-xl px-1 text-center text-[11px] font-semibold text-slate-500 outline-none transition-colors hover:bg-brand/5 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand dark:text-slate-300"
        >
          <MoreHorizontal size={21} aria-hidden="true" />
          <span className="max-w-full truncate">{language === "fa" ? "بیشتر" : "More"}</span>
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
        <aside id="admin-mobile-navigation-sheet" dir={profile.direction} className="grid gap-5">
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
