import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { adminDestination } from "./admin-navigation";
import type { AdminCurrentNavigation } from "./layout-types";
import { useAdminShellCopy, useLocale } from "../../shared/ui/locale";

export function AdminContextSidebar({
  collapsed,
  mainCollapsed,
  current,
  sourceSection,
  items,
  unreadNotifications,
  selectedStudentId,
  onToggle,
  direction,
}: {
  collapsed: boolean;
  mainCollapsed: boolean;
  current: AdminCurrentNavigation;
  /** Canonical section name retained for route construction. */
  sourceSection: string;
  items: ReadonlyArray<{
    path: string;
    title: string;
    icon: ComponentType<{
      size?: string | number;
      className?: string;
      strokeWidth?: string | number;
    }>;
  }>;
  unreadNotifications: number;
  selectedStudentId: string;
  onToggle: () => void;
  direction: "rtl" | "ltr";
}) {
  const copy = useAdminShellCopy();
  const { profile } = useLocale();
  const widthClasses = collapsed ? "w-16 p-2" : "w-16 p-2 xl:w-52 xl:p-3";

  return (
    <aside
      className={`fixed inset-y-0 start-0 z-40 hidden flex-col border-e border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] transition-[inset-inline-start,width,padding] duration-200 motion-reduce:transition-none lg:flex ${mainCollapsed ? "start-[4.25rem]" : "start-60"} ${widthClasses}`}
      aria-label={copy.sectionNavigation(current.section)}
    >
      <div
        className={`mb-3 flex h-10 shrink-0 items-center ${collapsed ? "justify-center" : "justify-center xl:justify-between xl:gap-2 xl:px-1"}`}
      >
        {!collapsed ? (
          <div className="hidden min-w-0 xl:block">
            <p className="truncate text-[10px] font-bold text-slate-400">{copy.activeSection}</p>
            <p className="truncate text-xs font-black text-slate-600">{current.section}</p>
          </div>
        ) : null}
        <button
          type="button"
          className="hidden size-9 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-white focus-visible:ring-2 focus-visible:ring-brand xl:grid"
          title={collapsed ? copy.openSectionRail : copy.closeSectionRail}
          aria-label={collapsed ? copy.openSectionRail : copy.closeSectionRail}
          aria-expanded={!collapsed}
          onClick={onToggle}
        >
          {collapsed === (direction === "rtl") ? (
            <ChevronLeft size={18} />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
      </div>

      <nav className="grid min-h-0 flex-1 content-start gap-1 overflow-y-auto overscroll-contain pb-2">
        {items.map(({ path, title, icon: Icon }) => {
          const active = current.path === path;
          const unread = path === "communication/notifications" ? unreadNotifications : 0;
          const compactClasses = collapsed
            ? "justify-center px-2"
            : "justify-center px-2 xl:justify-start xl:gap-2 xl:px-3";
          const badgeClasses = collapsed
            ? "absolute -end-0.5 -top-0.5"
            : "absolute -end-0.5 -top-0.5 xl:static xl:ms-auto";

          return (
            <NavLink
              key={path}
              to={adminDestination(path, sourceSection, selectedStudentId)}
              title={title}
              aria-label={title}
              aria-current={active ? "page" : undefined}
              className={`relative flex h-10 items-center rounded-md text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${compactClasses} ${active ? "bg-brand/10 font-semibold text-brand ring-1 ring-brand/15" : "text-slate-600 hover:bg-[rgb(var(--surface-card))] hover:text-ink"}`}
            >
              {active ? (
                <span
                  className="absolute inset-y-2 start-0 w-0.5 rounded-e-full bg-brand"
                  aria-hidden="true"
                />
              ) : null}
              <Icon className="shrink-0" size={17} strokeWidth={active ? 2.4 : 1.9} />
              {!collapsed ? <span className="hidden truncate xl:block">{title}</span> : null}
              {unread ? (
                <span
                  className={`${badgeClasses} min-w-5 rounded-full bg-rose-600 px-1 text-center text-[10px] font-black leading-5 text-white`}
                  aria-label={copy.unreadNotifications(unread)}
                >
                  {Math.min(unread, 99).toLocaleString(profile.locale)}
                  {unread > 99 ? "+" : ""}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
