import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAdminNotifications } from "../../../features/notifications";
import { useAuth } from "../../../features/auth";
import { AdminCommandPalette } from "../command-palette/AdminCommandPalette";
import { AdminContextSidebar } from "../navigation/AdminContextSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminMainSidebar } from "../navigation/AdminMainSidebar";
import { AdminMobileBottomNav } from "../navigation/AdminMobileNavigation";
import {
  localizedAdminBreadcrumbs,
  localizedAdminCurrentNavigation,
  localizedNavigationForCapabilities,
  resolveAdminNavigation,
} from "../navigation/admin-navigation";
import { adminContentOffsetClass, shouldAutoCollapseMainRail } from "./layout-geometry";
import { usePersistentCollapse } from "../layout-storage";
import { roleLabel } from "../../../shared/lib/role-ui";
import { useLocale } from "../../../shared/ui/locale";
import { useDevicePerformance } from "./use-device-performance";

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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const wasContextRailVisible = useRef(false);
  const performance = useDevicePerformance();

  const sourceCurrent = resolveAdminNavigation(location.pathname, auth.activeRole);
  const current = localizedAdminCurrentNavigation(location.pathname, language, auth.activeRole);
  const breadcrumbs = localizedAdminBreadcrumbs(location.pathname, language, auth.activeRole);
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

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);

  useEffect(() => {
    document.documentElement.dataset.adminMotion = performance === "reduced" ? "reduce" : "full";
    return () => {
      delete document.documentElement.dataset.adminMotion;
    };
  }, [performance]);

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
      data-performance={performance}
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
        <div className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top))] items-end justify-center overflow-hidden bg-paper pb-2 pt-[env(safe-area-inset-top)] lg:hidden">
          <img
            src="/right-left-angel.png"
            width={136}
            height={46}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="pointer-events-none absolute end-[calc(50%+3.5rem)] bottom-1 h-9 w-[8.5rem] max-w-[31vw] object-contain object-right"
          />
          <img
            src="/logo-bastak.webp"
            width={120}
            height={40}
            alt="زانین"
            decoding="async"
            className="relative z-10 h-10 w-auto max-w-[min(10rem,65vw)] object-contain"
          />
          <img
            src="/right-left-angel.png"
            width={136}
            height={46}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="pointer-events-none absolute start-[calc(50%+3.5rem)] bottom-1 h-9 w-[8.5rem] max-w-[31vw] scale-x-[-1] object-contain object-right"
          />
        </div>
        {auth.activeRole === "PLATFORM_ADMIN" ? (
          <section
            className="mx-3 mt-2 flex items-start gap-2 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-950 dark:border-amber-700 dark:bg-amber-950/35 dark:text-amber-100 lg:hidden"
            role="status"
            aria-label="هشدار استفاده از مدیریت پلتفرم در موبایل"
          >
            <AlertTriangle className="mt-0.5 shrink-0" size={16} aria-hidden="true" />
            <p>
              مدیریت پلتفرم برای صفحه‌نمایش بزرگ طراحی شده است. می‌توانید ادامه دهید، اما جدول‌ها و
              ابزارهای مدیریتی کامل‌تر در دسکتاپ در دسترس‌اند.
            </p>
          </section>
        ) : null}
        <div className="hidden lg:block">
          <AdminHeader
            current={current}
            breadcrumbs={breadcrumbs}
            selectedStudentId={selectedStudentId}
            sticky
            role={roleLabel(auth.activeRole, language)}
            organization={auth.context?.activeOrganization?.name}
            multipleRoles={
              (auth.context?.roles.filter((role) => role !== "STUDENT").length || 0) > 1
            }
            showStudent={sourceCurrent.section === "آموزش"}
            performance={performance}
          />
        </div>

        <main className="w-full min-w-0 px-3 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-5 sm:py-5 lg:px-6 lg:pb-6 xl:px-8">
          <div className="admin-page-shell mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      <AdminMobileBottomNav
        current={current}
        selectedStudentId={selectedStudentId}
        performance={performance}
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
