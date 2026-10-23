import { ChevronDown, ChevronLeft, ChevronRight, LayoutDashboard, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { adminDestination, localizedNavigationForCapabilities } from "../config/admin-navigation";
import { useAuth } from "../../../../features/identity/auth";
import { rolePortalTitle } from "../../../../shared/lib/role-ui";
import { useAdminShellCopy, useLocale } from "../../../../shared/ui/locale";

export function AdminMainSidebar({
  collapsed,
  currentSection,
  currentPath,
  selectedStudentId,
  onToggle,
  onOpenSearch,
  direction,
  viewport = "desktop",
}: {
  collapsed: boolean;
  currentSection: string;
  currentPath: string;
  selectedStudentId: string;
  onToggle: () => void;
  onOpenSearch: () => void;
  direction: "rtl" | "ltr";
  viewport?: "tablet" | "desktop";
}) {
  const auth = useAuth();
  const { language } = useLocale();
  const copy = useAdminShellCopy();
  const navigationGroups = localizedNavigationForCapabilities(
    auth.capabilities,
    auth.activeRole,
    language,
  );
  const [collapsedSections, setCollapsedSections] = useState<ReadonlySet<string>>(() => new Set());
  const navigationRef = useRef<HTMLElement>(null);
  const [navigationOverflow, setNavigationOverflow] = useState({ above: false, below: false });

  useEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;

    const updateOverflow = () => {
      const maximumScrollTop = navigation.scrollHeight - navigation.clientHeight;
      const nextOverflow = {
        above: navigation.scrollTop > 1,
        below: navigation.scrollTop < maximumScrollTop - 1,
      };
      setNavigationOverflow((currentOverflow) =>
        currentOverflow.above === nextOverflow.above && currentOverflow.below === nextOverflow.below
          ? currentOverflow
          : nextOverflow,
      );
    };

    updateOverflow();
    navigation.addEventListener("scroll", updateOverflow, { passive: true });
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateOverflow);
    observer?.observe(navigation);

    return () => {
      navigation.removeEventListener("scroll", updateOverflow);
      observer?.disconnect();
    };
  }, [collapsed, navigationGroups]);
  const dashboard = {
    path: "",
    title: language === "en" ? "Dashboard" : "داشبورد",
    section: language === "en" ? "Dashboard" : "داشبورد",
    icon: LayoutDashboard,
  };
  const DashboardIcon = dashboard.icon;
  const dashboardActive = currentPath === "";
  return (
    <aside
      className={`admin-main-rail fixed inset-y-0 start-0 z-50 hidden flex-col border-e border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] transition-[width,padding] duration-200 motion-reduce:transition-none ${viewport === "tablet" ? "md:flex min-[1200px]:hidden" : "min-[1200px]:flex"} ${direction === "rtl" ? "shadow-[-1px_0_0_rgb(24_24_27_/_2%)]" : "shadow-[1px_0_0_rgb(24_24_27_/_2%)]"} ${collapsed ? "w-[4.25rem] p-2" : "w-60 p-3"}`}
      aria-label={copy.primaryNavigation}
    >
      <div
        className={`admin-rail-brand shrink-0 ${collapsed ? "mb-3 grid justify-items-center gap-1" : "mb-5 flex h-14 items-center justify-between gap-2 px-1"}`}
      >
        {!collapsed ? (
          <div className="min-w-0">
            <h1 className="truncate text-base font-black tracking-tight text-ink">
              {copy.appTitle}
            </h1>
            <p className="truncate text-[10px] font-bold tracking-wide text-slate-400">
              {rolePortalTitle(auth.activeRole, language)}
            </p>
          </div>
        ) : (
          <div
            className="grid size-9 place-items-center rounded-xl bg-brand text-sm font-black text-white shadow-sm"
            aria-hidden="true"
          >
            Z
          </div>
        )}
        {viewport === "tablet" ? (
          <button
            type="button"
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-white/70 hover:text-brand focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-white/10"
            title={collapsed ? copy.openMainRail : copy.closeMainRail}
            aria-label={collapsed ? copy.openMainRail : copy.closeMainRail}
            aria-expanded={!collapsed}
            onClick={onToggle}
          >
            {collapsed === (direction === "rtl") ? (
              <ChevronLeft size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
        ) : null}
      </div>

      {dashboard ? (
        <NavLink
          to={adminDestination(dashboard.path, dashboard.section, selectedStudentId)}
          title={dashboard.title}
          aria-label={dashboard.title}
          aria-current={dashboardActive ? "page" : undefined}
          className={`mb-4 flex h-11 w-full shrink-0 items-center rounded-xl border px-3 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${dashboardActive ? "border-brand/30 bg-brand text-white shadow-sm" : "border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] text-slate-600 hover:border-brand/30 hover:bg-brand/5 hover:text-brand dark:text-slate-300"} ${collapsed ? "justify-center px-2" : "gap-2"}`}
        >
          <DashboardIcon className="size-5 shrink-0" strokeWidth={dashboardActive ? 2.4 : 2} />
          {!collapsed ? <span className="truncate">{dashboard.title}</span> : null}
        </NavLink>
      ) : null}

      <button
        type="button"
        className={`mb-4 flex h-10 w-full shrink-0 items-center rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] text-slate-500 outline-none transition hover:bg-[rgb(var(--surface-card))] hover:text-brand focus-visible:ring-2 focus-visible:ring-brand ${collapsed ? "justify-center px-2" : "gap-2 px-3"}`}
        onClick={onOpenSearch}
        title={collapsed ? copy.searchAndGo : undefined}
        aria-label={copy.searchAndGo}
      >
        <Search size={17} className="shrink-0" />
        {!collapsed ? (
          <>
            <span className="min-w-0 flex-1 truncate text-start text-xs font-semibold">
              {copy.searchAndGo}
            </span>
            <kbd
              className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-400"
              dir="ltr"
            >
              Ctrl ⇧ P
            </kbd>
          </>
        ) : null}
      </button>

      <div className="relative min-h-0 flex-1">
        <nav
          ref={navigationRef}
          className="admin-main-nav grid h-full content-start gap-3 overflow-y-auto overscroll-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {navigationGroups.map((group) => {
            const isCurrentGroup = currentSection === group.section;
            const isOpen = isCurrentGroup || !collapsedSections.has(group.sectionKey);
            return (
              <section key={group.sectionKey} className="grid gap-1" aria-label={group.section}>
                {!collapsed ? (
                  <button
                    type="button"
                    className="flex h-7 items-center justify-between rounded-lg px-2 py-6 text-[20px] font-black tracking-wide text-slate-400 outline-none transition hover:bg-[rgb(var(--surface-muted))] hover:text-brand focus-visible:ring-2 focus-visible:ring-brand"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setCollapsedSections((sections) => {
                        const next = new Set(sections);
                        if (next.has(group.sectionKey)) next.delete(group.sectionKey);
                        else next.add(group.sectionKey);
                        return next;
                      })
                    }
                  >
                    <span>{group.section}</span>
                    <ChevronDown
                      size={14}
                      className={`transition ${isOpen ? "rotate-0" : "-rotate-90"}`}
                      aria-hidden="true"
                    />
                  </button>
                ) : null}
                {(collapsed || isOpen) &&
                  group.items.map(({ path, title, icon: Icon }) => {
                    const active = currentPath === path;
                    return (
                      <NavLink
                        key={path}
                        to={adminDestination(path, group.sectionKey, selectedStudentId)}
                        end={path === ""}
                        title={title}
                        aria-label={title}
                        aria-current={active ? "page" : undefined}
                        className={`relative flex h-10 items-center rounded-xl text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-brand ${collapsed ? "justify-center px-2" : "gap-2 px-3"} ${active ? "admin-rail-item-active bg-brand/10 text-brand" : "text-slate-600 hover:bg-[rgb(var(--surface-muted))] hover:text-ink dark:text-slate-300"}`}
                      >
                        {active ? (
                          <span
                            className="absolute inset-y-2 start-0 w-0.5 rounded-e-full bg-brand"
                            aria-hidden="true"
                          />
                        ) : null}
                        <Icon className="shrink-0" size={18} strokeWidth={active ? 2.4 : 1.9} />
                        {!collapsed ? <span className="truncate">{title}</span> : null}
                      </NavLink>
                    );
                  })}
              </section>
            );
          })}
        </nav>
        {navigationOverflow.above ? (
          <span
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 rounded-b bg-slate-600/70 shadow-[0_9px_16px_4px_rgb(15_23_42_/_38%)] dark:bg-slate-300/70"
            aria-hidden="true"
          />
        ) : null}
        {navigationOverflow.below ? (
          <span
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-1 rounded-t bg-slate-600/70 shadow-[0_-9px_16px_4px_rgb(15_23_42_/_38%)] dark:bg-slate-300/70"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </aside>
  );
}
