import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../../../features/auth";
import { useAdminNotifications } from "../../../features/notifications";
import { roleLabel } from "../../../shared/lib/role-ui";
import { useLocale } from "../../../shared/ui/locale";
import {
  localizedAdminBreadcrumbs,
  localizedAdminCurrentNavigation,
  localizedNavigationForCapabilities,
  resolveAdminNavigation,
} from "../navigation/config/admin-navigation";
import { usePersistentCollapse } from "../lib/layout-storage";
import { shouldAutoCollapseMainRail } from "../lib/layout-geometry";
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

export function useAdminShellModel() {
  const auth = useAuth();
  const { language, profile } = useLocale();
  const notificationState = useAdminNotifications();
  const location = useLocation();
  const [mainCollapsed, setMainCollapsed] = usePersistentCollapse("admin-main-sidebar-collapsed");
  const [contextCollapsed, setContextCollapsed] = usePersistentCollapse(
    "admin-context-sidebar-collapsed",
  );
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

  useEffect(() => {
    if (shouldAutoCollapseMainRail(wasContextRailVisible.current, showContextRail)) {
      setMainCollapsed(true);
    }
    wasContextRailVisible.current = showContextRail;
  }, [showContextRail, setMainCollapsed]);

  return {
    auth,
    breadcrumbs,
    contextCollapsed,
    contextual,
    current,
    direction: profile.direction,
    mainCollapsed,
    multipleRoles: (auth.context?.roles.filter((role) => role !== "STUDENT").length || 0) > 1,
    notificationState,
    organization: auth.context?.activeOrganization?.name,
    performance,
    role: roleLabel(auth.activeRole, language),
    selectedStudentId,
    setContextCollapsed,
    setMainCollapsed,
    showContextRail,
    showStudent: sourceCurrent.section === "آموزش",
    sourceCurrent,
  };
}

export type AdminShellModel = ReturnType<typeof useAdminShellModel>;
