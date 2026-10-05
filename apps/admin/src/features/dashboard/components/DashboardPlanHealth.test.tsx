import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { DashboardPlanHealth, dashboardPlanHealth } from "./DashboardPlanHealth";

describe("DashboardPlanHealth", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("keeps progress bounded and renders a localized planner handoff", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    render(
      <MemoryRouter>
        <LocaleProvider>
          <DashboardPlanHealth value={{ plans: 2, tasks: 8, completed: 5 }} href="/admin/planner" />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(dashboardPlanHealth({ plans: 1, tasks: 2, completed: 5 }).completion).toBe(100);
    expect(screen.getByRole("heading", { name: "Today’s plan health" })).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Completion rate" })).toHaveAttribute(
      "aria-valuenow",
      "63",
    );
    expect(screen.getByRole("link", { name: "Open planner" })).toHaveAttribute(
      "href",
      "/admin/planner",
    );
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
