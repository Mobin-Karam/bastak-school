import { describe, expect, it } from "vitest";
import {
  createRoleDashboardView,
  dashboardSearchForView,
  dashboardViewFromSearch,
  hasDashboardViewSearch,
} from "./dashboard-layout";

describe("role dashboard layout", () => {
  it("keeps the operational queue primary and platform health secondary", () => {
    const view = createRoleDashboardView("PLATFORM_ADMIN");
    expect(view.widgets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "summary", zone: "full" }),
        expect.objectContaining({ id: "priority-work", zone: "primary" }),
        expect.objectContaining({ id: "platform-health", zone: "secondary" }),
        expect.objectContaining({ id: "platform-organizations", zone: "primary" }),
        expect.objectContaining({ id: "operational-pulse", zone: "full" }),
      ]),
    );
  });

  it("offers the visual operational pulse only to roles with the underlying health data", () => {
    expect(
      createRoleDashboardView("ORGANIZATION_ADMIN").widgets.some(
        (widget) => widget.id === "operational-pulse",
      ),
    ).toBe(true);
    expect(
      createRoleDashboardView("ADVISOR").widgets.some(
        (widget) => widget.id === "operational-pulse",
      ),
    ).toBe(false);
  });

  it("does not add platform-only health detail to other roles", () => {
    expect(
      createRoleDashboardView("ADVISOR").widgets.some((widget) => widget.id === "platform-health"),
    ).toBe(false);
  });

  it("adds the schedule widget only where the API returns role-scoped upcoming work", () => {
    expect(
      createRoleDashboardView("ADVISOR").widgets.some(
        (widget) => widget.id === "upcoming-schedule",
      ),
    ).toBe(true);
    expect(
      createRoleDashboardView("PLATFORM_ADMIN").widgets.some(
        (widget) => widget.id === "upcoming-schedule",
      ),
    ).toBe(false);
  });

  it("adds plan health only to operational roles with plan-progress data", () => {
    expect(
      createRoleDashboardView("MENTOR").widgets.some((widget) => widget.id === "plan-health"),
    ).toBe(true);
    expect(
      createRoleDashboardView("TEACHER").widgets.some((widget) => widget.id === "plan-health"),
    ).toBe(false);
    expect(
      createRoleDashboardView("ORGANIZATION_ADMIN").widgets.some(
        (widget) => widget.id === "plan-health",
      ),
    ).toBe(true);
  });

  it("uses URL layout state as an allowlisted portable override", () => {
    const base = createRoleDashboardView("ADVISOR");
    const shared = dashboardViewFromSearch(
      base,
      new URLSearchParams("dashboard-density=compact&dashboard-hidden=plan-health,foreign"),
    );
    expect(hasDashboardViewSearch(new URLSearchParams("dashboard-density=compact"))).toBe(true);
    expect(shared.density).toBe("compact");
    expect(shared.widgets.find((widget) => widget.id === "plan-health")?.visible).toBe(false);
    expect(shared.widgets.some((widget) => widget.id === "foreign")).toBe(false);
    expect(
      dashboardSearchForView(new URLSearchParams("studentId=student-1"), shared, base).toString(),
    ).toBe("studentId=student-1&dashboard-density=compact&dashboard-hidden=plan-health");
  });
});
