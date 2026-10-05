import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAdminNotifications } from "../../features/notifications";
import { useAuth } from "../../features/auth";
import { AdminCommandPalette } from "./AdminCommandPalette";
import { AdminContextSidebar } from "./AdminContextSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminMainSidebar } from "./AdminMainSidebar";
import { AdminMobileBottomNav, AdminMobileDrawer } from "./AdminMobileNavigation";
import {
  localizedAdminBreadcrumbs,
  localizedAdminCurrentNavigation,
  localizedNavigationForCapabilities,
  resolveAdminNavigation,
} from "./admin-navigation";
import { adminContentOffsetClass, shouldAutoCollapseMainRail } from "./layout-geometry";
import { usePersistentCollapse } from "./layout-storage";
import { roleLabel } from "../../shared/lib/role-ui";
import { useLocale } from "../../shared/ui/locale";

function readSelectedStudentId(search: string) {
  const urlValue = new URLSearchParams(search).get("studentId");
  if (urlValue) return urlValue;
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem("admin-selected-student-id") || "";
  } catch {
    return "";
  }
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"], [role="combobox"]',
    ),
  );
}

export function AdminLayout() {
  const auth = useAuth();
  const { language, profile } = useLocale();
  const notificationState = useAdminNotifications();
  const location = useLocation();
  const [mainCollapsed, setMainCollapsed] = usePersistentCollapse("admin-main-sidebar-collapsed");
  const [contextCollapsed, setContextCollapsed] = usePersistentCollapse(
    "admin-context-sidebar-collapsed",
  );
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const wasContextRailVisible = useRef(false);

  const sourceCurrent = resolveAdminNavigation(location.pathname);
  const current = localizedAdminCurrentNavigation(location.pathname, language);
  const breadcrumbs = localizedAdminBreadcrumbs(location.pathname, language);
  const contextual =
    localizedNavigationForCapabilities(auth.capabilities, auth.activeRole, language).find(
      (group) => group.sectionKey === sourceCurrent.section,
    )?.items || [];
  const showContextRail = contextual.length > 1;
  const selectedStudentId = readSelectedStudentId(location.search);

  // Entering a multi-page section reveals the adjacent contextual rail. Collapse
  // the primary (right) rail once to preserve workspace width; users may reopen it.
  useEffect(() => {
    if (shouldAutoCollapseMainRail(wasContextRailVisible.current, showContextRail))
      setMainCollapsed(true);
    wasContextRailVisible.current = showContextRail;
  }, [showContextRail, setMainCollapsed]);

  const openMobileNavigation = useCallback(() => setMobileNavigationOpen(true), []);
  const closeMobileNavigation = useCallback(() => setMobileNavigationOpen(false), []);
  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);

  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || isEditableTarget(event.target)) return;
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div
      className="admin-role-shell h-dvh overflow-hidden bg-paper text-ink"
      data-role={auth.activeRole ?? "DEFAULT"}
      dir={profile.direction}
    >
      <AdminMainSidebar
        collapsed={mainCollapsed}
        currentSection={current.section}
        currentPath={current.path}
        selectedStudentId={selectedStudentId}
        onToggle={() => setMainCollapsed((value) => !value)}
        onOpenSearch={openCommandPalette}
        direction={profile.direction}
      />

      {showContextRail ? (
        <AdminContextSidebar
          collapsed={contextCollapsed}
          mainCollapsed={mainCollapsed}
          current={current}
          sourceSection={sourceCurrent.section}
          items={contextual}
          unreadNotifications={notificationState.unread}
          selectedStudentId={selectedStudentId}
          onToggle={() => setContextCollapsed((value) => !value)}
          direction={profile.direction}
        />
      ) : null}

      <div
        className={`${adminContentOffsetClass({
          showContextRail,
          mainCollapsed,
          contextCollapsed,
          direction: profile.direction,
        })} scroll-reveal h-dvh min-w-0 overflow-y-auto overscroll-contain transition-[margin] duration-200 motion-reduce:transition-none`}
      >
        <AdminHeader
          current={current}
          breadcrumbs={breadcrumbs}
          selectedStudentId={selectedStudentId}
          sticky={current.path !== "planner"}
          onOpenMobileNavigation={openMobileNavigation}
          role={roleLabel(auth.activeRole, language)}
          organization={auth.context?.activeOrganization?.name}
          multipleRoles={(auth.context?.roles.filter((role) => role !== "STUDENT").length || 0) > 1}
          showStudent={sourceCurrent.section === "آموزش"}
        />

        <main className="w-full min-w-0 px-3 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-5 lg:px-6 lg:pb-6 xl:px-8">
          <div className="admin-page-shell mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      <AdminMobileBottomNav
        current={current}
        selectedStudentId={selectedStudentId}
        direction={profile.direction}
      />
      <AdminMobileDrawer
        open={mobileNavigationOpen}
        current={current}
        selectedStudentId={selectedStudentId}
        unreadNotifications={notificationState.unread}
        onClose={closeMobileNavigation}
        onOpenSearch={openCommandPalette}
        direction={profile.direction}
      />
      <AdminCommandPalette
        open={commandPaletteOpen}
        current={current}
        selectedStudentId={selectedStudentId}
        onClose={closeCommandPalette}
      />
    </div>
  );
}
