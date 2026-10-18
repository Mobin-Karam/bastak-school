import {
  applyDashboardViewState,
  createDashboardPreferenceStore,
  createDashboardView,
  dashboardViewIsDirty,
  dashboardViewState,
  mergeDashboardView,
  selectDashboardWidgets,
  type DashboardView,
} from "@moshaver/admin-workspace-ui";
import { useEffect, useMemo, useState } from "react";

const DASHBOARD_VIEW_ID = "role-workspace";
const DASHBOARD_DENSITY_PARAM = "dashboard-density";
const DASHBOARD_HIDDEN_PARAM = "dashboard-hidden";

function storageAdapter() {
  return {
    getItem(key: string) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key: string, value: string) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Preferences are optional and must never block the dashboard.
      }
    },
  };
}

export function createRoleDashboardView(role?: string | null) {
  const supportsSchedule = ["ADVISOR", "TEACHER", "MENTOR"].includes(role || "");
  const supportsPlanHealth = ["ADVISOR", "MENTOR", "ORGANIZATION_ADMIN"].includes(role || "");
  const supportsOperationalPulse = ["PLATFORM_ADMIN", "ORGANIZATION_ADMIN"].includes(role || "");
  return createDashboardView({
    id: `${DASHBOARD_VIEW_ID}:${role || "default"}`,
    density: "comfortable",
    widgets: [
      { id: "summary", zone: "full", order: 0, width: 12, height: 1 },
      ...(supportsOperationalPulse
        ? [{ id: "operational-pulse", zone: "full" as const, order: 1, width: 12, height: 1 }]
        : []),
      { id: "priority-work", zone: "primary", order: 2, width: 8, height: 2 },
      { id: "next-actions", zone: "secondary", order: 3, width: 4, height: 1 },
      ...(supportsSchedule
        ? [{ id: "upcoming-schedule", zone: "secondary" as const, order: 4, width: 4, height: 1 }]
        : []),
      ...(supportsPlanHealth
        ? [{ id: "plan-health", zone: "secondary" as const, order: 5, width: 4, height: 1 }]
        : []),
      ...(role === "PLATFORM_ADMIN"
        ? [
            { id: "platform-health", zone: "secondary" as const, order: 5, width: 4, height: 1 },
            {
              id: "platform-organizations",
              zone: "primary" as const,
              order: 6,
              width: 8,
              height: 2,
            },
          ]
        : []),
      ...(role === "ORGANIZATION_ADMIN"
        ? [
            { id: "student-health", zone: "secondary" as const, order: 6, width: 8, height: 1 },
            { id: "weekly-plan-health", zone: "secondary" as const, order: 7, width: 4, height: 1 },
          ]
        : []),
    ],
  });
}

export function dashboardViewFromSearch(defaultView: DashboardView, search: URLSearchParams) {
  const requestedDensity = search.get(DASHBOARD_DENSITY_PARAM);
  return applyDashboardViewState(defaultView, {
    density:
      requestedDensity === "comfortable" || requestedDensity === "compact"
        ? requestedDensity
        : undefined,
    hidden: (search.get(DASHBOARD_HIDDEN_PARAM) || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  });
}

export function hasDashboardViewSearch(search: URLSearchParams) {
  return Boolean(search.get(DASHBOARD_DENSITY_PARAM) || search.get(DASHBOARD_HIDDEN_PARAM));
}

export function dashboardSearchForView(
  search: URLSearchParams,
  view: DashboardView,
  defaultView: DashboardView,
) {
  const next = new URLSearchParams(search);
  if (!dashboardViewIsDirty(view, defaultView)) {
    next.delete(DASHBOARD_DENSITY_PARAM);
    next.delete(DASHBOARD_HIDDEN_PARAM);
    return next;
  }
  const state = dashboardViewState(view);
  if (state.density === defaultView.density) next.delete(DASHBOARD_DENSITY_PARAM);
  else next.set(DASHBOARD_DENSITY_PARAM, state.density || "comfortable");
  if (state.hidden?.length) next.set(DASHBOARD_HIDDEN_PARAM, state.hidden.join(","));
  else next.delete(DASHBOARD_HIDDEN_PARAM);
  return next;
}

export function useRoleDashboardView(
  role?: string | null,
  options?: { sharedView?: DashboardView; onChange?: (view: DashboardView) => void },
) {
  const defaultView = useMemo(() => createRoleDashboardView(role), [role]);
  const [view, setView] = useState<DashboardView>(defaultView);
  const sharedView = options?.sharedView;
  const sharedViewKey = sharedView ? JSON.stringify(sharedView) : "";

  useEffect(() => {
    const store = createDashboardPreferenceStore({
      namespace: "moshaver-admin",
      storage: storageAdapter(),
    });
    const saved = store.load(defaultView.id);
    setView(sharedView ?? (saved ? mergeDashboardView(defaultView, saved) : defaultView));
  }, [defaultView, sharedView, sharedViewKey]);

  const save = (next: DashboardView) => {
    setView(next);
    createDashboardPreferenceStore({
      namespace: "moshaver-admin",
      storage: storageAdapter(),
    }).save(next);
    options?.onChange?.(next);
  };

  const setDensity = (density: "comfortable" | "compact") => {
    const next = createDashboardView({ ...view, density });
    save(next);
  };

  const setMode = (mode: "board" | "live") => {
    save(createDashboardView({ ...view, mode }));
  };

  const setWidgetVisible = (id: string, visible: boolean) => {
    const next = createDashboardView({
      ...view,
      widgets: view.widgets.map((widget) => (widget.id === id ? { ...widget, visible } : widget)),
    });
    save(next);
  };

  const setWidgetLayout = (
    id: string,
    patch: { order?: number; width?: number; height?: number },
  ) => {
    const next = createDashboardView({
      ...view,
      widgets: view.widgets.map((widget) => (widget.id === id ? { ...widget, ...patch } : widget)),
    });
    save(next);
  };

  const setWidgetOrder = (ids: string[]) => {
    const orderById = new Map(ids.map((id, order) => [id, order]));
    const next = createDashboardView({
      ...view,
      widgets: view.widgets.map((widget) => ({
        ...widget,
        order: orderById.get(widget.id) ?? widget.order,
      })),
    });
    save(next);
  };

  const reset = () => {
    createDashboardPreferenceStore({
      namespace: "moshaver-admin",
      storage: storageAdapter(),
    }).remove(defaultView.id);
    setView(defaultView);
    options?.onChange?.(defaultView);
  };

  return { view, setDensity, setMode, setWidgetVisible, setWidgetLayout, setWidgetOrder, reset };
}

export function visibleRoleDashboardWidgets(
  view: DashboardView,
  zone?: "primary" | "secondary" | "full",
) {
  return selectDashboardWidgets(view, zone);
}
